import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { resolvePDFJS } from "https://esm.sh/pdfjs-serverless@0.4.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { document_id, process_all, reprocess_binary } = await req.json();

    let documents: any[] = [];

    if (reprocess_binary) {
      // Modo 3: reprocessar documentos com conteúdo que é raw PDF binary
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, file_url, file_type")
        .not("file_url", "is", null)
        .in("file_type", ["pdf", "docx", "doc", "txt"])
        .like("content", "%endstream%");

      if (error) throw error;
      documents = data || [];
      console.log(`🔄 Reprocessando ${documents.length} documentos com conteúdo binário raw...`);
    } else if (process_all) {
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, file_url, file_type")
        .not("file_url", "is", null)
        .in("file_type", ["pdf", "docx", "doc", "txt"])
        .or("content.is.null,content.eq.");

      if (error) throw error;
      documents = data || [];

      const { data: metaOnly, error: metaErr } = await supabase
        .from("documents")
        .select("id, title, file_url, file_type")
        .not("file_url", "is", null)
        .in("file_type", ["pdf", "docx", "doc", "txt"])
        .like("content", "Documento:%");

      if (!metaErr && metaOnly) {
        const existingIds = new Set(documents.map((d: any) => d.id));
        for (const doc of metaOnly) {
          if (!existingIds.has(doc.id)) {
            documents.push(doc);
          }
        }
      }
    } else if (document_id) {
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, file_url, file_type")
        .eq("id", document_id)
        .single();

      if (error) throw error;
      documents = data ? [data] : [];
    } else {
      return new Response(
        JSON.stringify({ error: "Informe document_id ou process_all: true" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📄 Processando ${documents.length} documento(s)...`);

    const results: any[] = [];

    for (const doc of documents) {
      try {
        console.log(`📖 Extraindo: ${doc.title} (${doc.file_type})`);

        let fileUrl = doc.file_url;

        // Se a URL é signed e expirou, gerar nova URL
        if (fileUrl.includes("/object/sign/")) {
          const pathMatch = fileUrl.match(/\/object\/sign\/documents\/(.+?)(\?|$)/);
          if (pathMatch) {
            const storagePath = decodeURIComponent(pathMatch[1]);
            const { data: signedUrl, error: signErr } = await supabase.storage
              .from("documents")
              .createSignedUrl(storagePath, 3600);
            if (signErr) throw signErr;
            fileUrl = signedUrl.signedUrl;
          }
        } else if (fileUrl.includes("/object/public/")) {
          // URL pública, pode usar direto
        } else {
          const fileName = doc.title;
          const { data: objectList } = await supabase.storage
            .from("documents")
            .list("", { search: fileName, limit: 1 });
          
          if (objectList && objectList.length > 0) {
            const { data: signedUrl } = await supabase.storage
              .from("documents")
              .createSignedUrl(objectList[0].name, 3600);
            if (signedUrl) fileUrl = signedUrl.signedUrl;
          }
        }

        // Baixar o arquivo
        const fileResponse = await fetch(fileUrl);
        if (!fileResponse.ok) {
          throw new Error(`Falha ao baixar: ${fileResponse.status}`);
        }

        const fileBuffer = await fileResponse.arrayBuffer();
        const fileBytes = new Uint8Array(fileBuffer);
        let extractedText = "";

        if (doc.file_type === "txt") {
          extractedText = new TextDecoder().decode(fileBytes);
        } else if (doc.file_type === "pdf") {
          extractedText = await extractTextFromPDF(fileBytes);
        } else if (doc.file_type === "docx" || doc.file_type === "doc") {
          extractedText = await extractTextFromDOCX(fileBytes);
        }

        extractedText = extractedText.trim();

        if (extractedText.length < 20) {
          console.warn(`⚠️ Texto muito curto para ${doc.title}: ${extractedText.length} chars`);
          results.push({
            id: doc.id,
            title: doc.title,
            status: "warning",
            message: `Texto extraído muito curto (${extractedText.length} chars) - pode ser PDF escaneado/imagem`,
          });
          continue;
        }

        const { error: updateErr } = await supabase
          .from("documents")
          .update({ content: extractedText })
          .eq("id", doc.id);

        if (updateErr) throw updateErr;

        console.log(`✅ ${doc.title}: ${extractedText.length} chars extraídos`);
        results.push({
          id: doc.id,
          title: doc.title,
          status: "success",
          chars: extractedText.length,
        });
      } catch (docErr: any) {
        console.error(`❌ Erro em ${doc.title}:`, docErr.message);
        results.push({
          id: doc.id,
          title: doc.title,
          status: "error",
          message: docErr.message,
        });
      }
    }

    const summary = {
      total: documents.length,
      success: results.filter((r) => r.status === "success").length,
      warnings: results.filter((r) => r.status === "warning").length,
      errors: results.filter((r) => r.status === "error").length,
      results,
    };

    console.log(`📊 Resumo: ${summary.success}/${summary.total} extraídos com sucesso`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("❌ Erro geral:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ==================== PDF EXTRACTION ====================

/**
 * Extrai texto de um PDF usando pdfjs-serverless (parsing real com suporte a CIDFont/ToUnicode).
 */
async function extractTextFromPDF(bytes: Uint8Array): Promise<string> {
  try {
    const pdfjsModule = await resolvePDFJS();
    const doc = await pdfjsModule.getDocument({ data: bytes, useSystemFonts: true }).promise;
    const pages: string[] = [];
    
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      if (pageText.trim()) pages.push(pageText.trim());
    }
    
    const result = pages.join('\n\n').replace(/\s+/g, ' ').trim();
    
    // Validação: descartar se resultado é lixo PDF
    const garbageIndicators = ['endstream', 'endobj', 'xref', '0000000'];
    if (garbageIndicators.filter(g => result.includes(g)).length >= 3) {
      console.warn('⚠️ Texto extraído contém lixo PDF. Descartando.');
      return '';
    }
    
    return result;
  } catch (e: any) {
    console.error('❌ pdfjs-serverless falhou:', e.message);
    return '';
  }
}

// ==================== DOCX EXTRACTION ====================

async function extractTextFromDOCX(bytes: Uint8Array): Promise<string> {
  try {
    const zipData = bytes;
    let xmlContent = findFileInZipStored(zipData, "word/document.xml");
    if (!xmlContent) {
      xmlContent = await findFileInZipDeflate(zipData, "word/document.xml");
    }
    if (!xmlContent) {
      return "Não foi possível extrair o conteúdo do DOCX";
    }

    let result = xmlContent;
    result = result.replace(/<\/w:p>/g, "\n");
    result = result.replace(/<[^>]+>/g, "");
    result = result.replace(/&amp;/g, "&");
    result = result.replace(/&lt;/g, "<");
    result = result.replace(/&gt;/g, ">");
    result = result.replace(/&quot;/g, '"');
    result = result.replace(/&apos;/g, "'");
    result = result.replace(/\n{3,}/g, "\n\n");

    return result.trim();
  } catch (e: any) {
    console.error("Erro ao processar DOCX:", e.message);
    return "";
  }
}

function findFileInZipStored(zipBytes: Uint8Array, targetPath: string): string | null {
  for (let i = 0; i < zipBytes.length - 30; i++) {
    if (zipBytes[i] === 0x50 && zipBytes[i + 1] === 0x4b && zipBytes[i + 2] === 0x03 && zipBytes[i + 3] === 0x04) {
      const compressionMethod = zipBytes[i + 8] | (zipBytes[i + 9] << 8);
      const compressedSize = zipBytes[i + 18] | (zipBytes[i + 19] << 8) | (zipBytes[i + 20] << 16) | (zipBytes[i + 21] << 24);
      const uncompressedSize = zipBytes[i + 22] | (zipBytes[i + 23] << 8) | (zipBytes[i + 24] << 16) | (zipBytes[i + 25] << 24);
      const fileNameLength = zipBytes[i + 26] | (zipBytes[i + 27] << 8);
      const extraFieldLength = zipBytes[i + 28] | (zipBytes[i + 29] << 8);
      const fileNameStart = i + 30;
      const fileName = new TextDecoder().decode(zipBytes.slice(fileNameStart, fileNameStart + fileNameLength));

      if (fileName === targetPath && compressionMethod === 0) {
        const dataStart = fileNameStart + fileNameLength + extraFieldLength;
        const size = compressedSize > 0 ? compressedSize : uncompressedSize;
        return new TextDecoder("utf-8").decode(zipBytes.slice(dataStart, dataStart + size));
      }
    }
  }
  return null;
}

async function findFileInZipDeflate(zipBytes: Uint8Array, targetPath: string): Promise<string | null> {
  for (let i = 0; i < zipBytes.length - 30; i++) {
    if (zipBytes[i] === 0x50 && zipBytes[i + 1] === 0x4b && zipBytes[i + 2] === 0x03 && zipBytes[i + 3] === 0x04) {
      const compressionMethod = zipBytes[i + 8] | (zipBytes[i + 9] << 8);
      const compressedSize = zipBytes[i + 18] | (zipBytes[i + 19] << 8) | (zipBytes[i + 20] << 16) | (zipBytes[i + 21] << 24);
      const fileNameLength = zipBytes[i + 26] | (zipBytes[i + 27] << 8);
      const extraFieldLength = zipBytes[i + 28] | (zipBytes[i + 29] << 8);
      const fileNameStart = i + 30;
      const fileName = new TextDecoder().decode(zipBytes.slice(fileNameStart, fileNameStart + fileNameLength));

      if (fileName === targetPath && compressionMethod === 8) {
        const dataStart = fileNameStart + fileNameLength + extraFieldLength;
        const compressed = zipBytes.slice(dataStart, dataStart + compressedSize);

        try {
          // [V1.9.71] "raw" não é valor válido em CompressionFormat (spec Web
          // Streams aceita 'gzip' | 'deflate' | 'deflate-raw'). DOCX/ZIP usam
          // DEFLATE puro sem header zlib, daí 'deflate-raw' é o correto.
          const ds = new DecompressionStream("deflate-raw");
          const writer = ds.writable.getWriter();
          writer.write(compressed);
          writer.close();

          const reader = ds.readable.getReader();
          const chunks: Uint8Array[] = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }

          const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
          const result = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
          }

          return new TextDecoder("utf-8").decode(result);
        } catch (e) {
          console.error("Deflate error:", e);
          return null;
        }
      }
    }
  }
  return null;
}
