
import sys

filepath = r'c:\Users\phpg6\OneDrive\Imagens\amigo-connect-hub-main\src\pages\AlunoDashboard.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

target = """                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 if (isActive) {
                                   handleOpenModule(0);
                                 } else {
                                   handleSwitchCourse(enrollment);
                                   // Scroll suave para dar feedback visual
                                   setTimeout(() => {
                                     window.scrollTo({ top: window.scrollY + 350, behavior: 'smooth' });
                                   }, 100);
                                 }
                               }}
                               className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${isActive ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'} flex items-center justify-center gap-2`}
                             >
                               {isActive ? 'Continuar Agora' : 'Acessar Terminal'}
                               <ArrowRight className="w-4 h-4" />
                             </button>"""

replacement = """                            <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleOpenModule(0, enrollment.courses);
                               }}
                               className="w-full py-3 rounded-xl font-bold text-sm transition-all bg-emerald-600 text-white flex items-center justify-center gap-2 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
                             >
                               Continuar Agora
                               <ArrowRight className="w-4 h-4" />
                             </button>"""

if target in content:
    new_content = content.replace(target, replacement)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS: Button replaced!")
else:
    # Try with slightly different indentation or line endings
    print("ERROR: Target not found. Indentation issue suspected.")
    # Fallback to a broader search
    import re
    pattern = re.escape(target).replace(r'\ ', r'\s+').replace(r'\n', r'\s+')
    if re.search(pattern, content):
        new_content = re.sub(pattern, replacement, content)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("SUCCESS: Button replaced using Regex!")
    else:
        print("ERROR: Even regex failed to find the target.")
