import { Header } from "@/components/layout/header";

const sections = [
  { id: "setup", title: "1. Setup Inicial" },
  { id: "flujo-diario", title: "2. Flujo Diario" },
  { id: "equipo", title: "3. Trabajo en Equipo" },
  { id: "emergencia", title: "4. Comandos de Emergencia" },
  { id: "recursos", title: "5. Recursos" },
  { id: "checklist", title: "6. Checklist" },
];

function Code({ children }: { children: string }) {
  return <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>;
}

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="my-3">
      {title && <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>}
      <pre className="bg-zinc-900 dark:bg-zinc-950 text-zinc-100 rounded-lg p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function Callout({ children, type = "info" }: { children: React.ReactNode; type?: "info" | "warning" | "danger" }) {
  const styles = {
    info: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    danger: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
  };
  return <div className={`rounded-lg border px-4 py-3 my-4 text-sm ${styles[type]}`}>{children}</div>;
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">{children}</a>;
}

export default function GitGuidePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header breadcrumbs={[{ label: "Guía de Git & Colaboración" }]} />
      <div className="flex flex-1">
        {/* TOC sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 border-r">
          <div className="sticky top-0 p-4 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Contenido</p>
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="block text-sm text-muted-foreground hover:text-foreground py-1 transition-colors">
                {s.title}
              </a>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 sm:p-8 max-w-4xl">
          <h1 className="text-3xl font-bold mb-2">Guía de Git, GitHub y Colaboración</h1>
          <p className="text-muted-foreground mb-8">Todo lo que necesitás para trabajar en equipo con el código de MGB.</p>

          {/* ─── PART 1 ─── */}
          <section id="setup" className="mb-12">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b">1. Setup Inicial (una sola vez)</h2>

            <h3 className="text-lg font-semibold mt-6 mb-2">1.1 Instalar Git</h3>
            <CodeBlock title="macOS (Homebrew):">{`brew install git`}</CodeBlock>
            <CodeBlock title="Windows:">{`# Descargar e instalar desde: https://git-scm.com/download/win
# IMPORTANTE: Elegir "Git Bash" como terminal en la instalación`}</CodeBlock>
            <CodeBlock title="Linux (Ubuntu/Debian):">{`sudo apt update
sudo apt install git`}</CodeBlock>
            <CodeBlock title="Verificar instalación:">{`git --version
# Debe mostrar algo como: git version 2.44.0`}</CodeBlock>

            <h3 className="text-lg font-semibold mt-6 mb-2">1.2 Configurar tu identidad</h3>
            <CodeBlock>{`# Configurar tu nombre (aparece en los commits)
git config --global user.name "Tu Nombre"

# Configurar tu email (debe ser el mismo que usás en GitHub)
git config --global user.email "tu@email.com"

# Verificar configuración
git config --list`}</CodeBlock>

            <h3 className="text-lg font-semibold mt-6 mb-2">1.3 Crear cuenta en GitHub</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm mb-4">
              <li>Ir a <ExternalLink href="https://github.com">github.com</ExternalLink> → Sign up</li>
              <li>Usar email profesional (el de MGB)</li>
              <li>Activar 2FA (Two-Factor Authentication) — <strong>obligatorio</strong></li>
              <li>Aceptar la invitación a la organización MGB en GitHub</li>
            </ol>

            <h3 className="text-lg font-semibold mt-6 mb-2">1.4 Configurar SSH Key</h3>
            <CodeBlock>{`# Generar SSH key
ssh-keygen -t ed25519 -C "tu@email.com"
# Presionar Enter en todo (usa las opciones por defecto)

# Copiar la key al clipboard
# macOS:
cat ~/.ssh/id_ed25519.pub | pbcopy
# Windows (Git Bash):
cat ~/.ssh/id_ed25519.pub | clip
# Linux:
cat ~/.ssh/id_ed25519.pub
# (copiar manualmente)

# Ir a GitHub → Settings → SSH and GPG keys → New SSH Key
# Pegar la key y guardar

# Probar conexión
ssh -T git@github.com
# Debe decir: "Hi username! You've successfully authenticated"`}</CodeBlock>
          </section>

          {/* ─── PART 2 ─── */}
          <section id="flujo-diario" className="mb-12">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b">2. Flujo de Trabajo Diario</h2>

            <h3 className="text-lg font-semibold mt-6 mb-2">2.1 Clonar un repositorio (primera vez)</h3>
            <CodeBlock>{`# Ir a la carpeta donde guardás tus proyectos
cd ~/proyectos

# Clonar el repo (usar la URL SSH del repo)
git clone git@github.com:mgb-software/nombre-del-proyecto.git

# Entrar al proyecto
cd nombre-del-proyecto

# Ver en qué branch estás
git branch
# Debería decir: * main`}</CodeBlock>

            <h3 className="text-lg font-semibold mt-6 mb-2">2.2 Crear una branch para trabajar</h3>
            <Callout type="danger">
              <strong>REGLA DE ORO:</strong> NUNCA trabajar directamente en <Code>main</Code> ni en <Code>develop</Code>. SIEMPRE crear una branch.
            </Callout>
            <CodeBlock>{`# Asegurarte de estar en develop y actualizado
git checkout develop
git pull origin develop

# Crear tu branch de trabajo
git checkout -b feature/nombre-de-lo-que-vas-a-hacer

# Ejemplos de nombres de branch:
# feature/login-page
# feature/api-clientes
# fix/error-en-dashboard
# hotfix/crash-en-produccion`}</CodeBlock>
            <p className="text-sm mt-2 mb-4"><strong>Convención de nombres:</strong> <Code>feature/descripcion</Code> (nueva funcionalidad), <Code>fix/descripcion</Code> (bug fix), <Code>hotfix/descripcion</Code> (urgente en producción). Siempre en minúsculas, palabras separadas por guiones.</p>

            <h3 className="text-lg font-semibold mt-6 mb-2">2.3 Hacer cambios y commitear</h3>
            <CodeBlock>{`# 1. Hacé tus cambios en el código...

# 2. Ver qué archivos cambiaste
git status

# 3. Ver los cambios en detalle (opcional)
git diff

# 4. Agregar archivos al staging
git add .                    # Agrega TODO
git add archivo.tsx          # Agrega un archivo específico
git add src/components/      # Agrega una carpeta entera

# 5. Hacer el commit con mensaje descriptivo
git commit -m "feat: agregar página de login con validación"

# Formato del mensaje (Conventional Commits):
# feat: nueva funcionalidad
# fix: corrección de bug
# docs: cambios en documentación
# style: cambios de formato (no lógica)
# refactor: reestructurar código sin cambiar funcionalidad
# chore: cambios en configs, dependencias`}</CodeBlock>

            <h3 className="text-lg font-semibold mt-6 mb-2">2.4 Subir cambios a GitHub</h3>
            <CodeBlock>{`# Primera vez que subís esta branch:
git push -u origin feature/nombre-de-lo-que-vas-a-hacer

# Las siguientes veces en la misma branch:
git push`}</CodeBlock>

            <h3 className="text-lg font-semibold mt-6 mb-2">2.5 Crear un Pull Request (PR)</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm mb-4">
              <li>Ir a GitHub → el repositorio → banner amarillo "Compare & pull request" → Click</li>
              <li>Título descriptivo de qué hace el PR</li>
              <li>Descripción: qué cambiaste, por qué, screenshots si es visual</li>
              <li>Asignar a los otros socios como <strong>Reviewers</strong></li>
              <li>Click en <strong>"Create pull request"</strong></li>
              <li>Esperar aprobación de al menos 1 reviewer</li>
              <li>Una vez aprobado → <strong>"Squash and merge"</strong> → confirmar</li>
            </ol>

            <h3 className="text-lg font-semibold mt-6 mb-2">2.6 Actualizar tu branch con los últimos cambios</h3>
            <CodeBlock>{`# Si develop avanzó mientras vos trabajabas:
git checkout develop
git pull origin develop
git checkout feature/tu-branch
git merge develop

# Si hay conflictos, resolverlos manualmente y después:
git add .
git commit -m "merge: resolver conflictos con develop"
git push`}</CodeBlock>
          </section>

          {/* ─── PART 3 ─── */}
          <section id="equipo" className="mb-12">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b">3. Trabajar en Equipo — Sincronización</h2>

            <h3 className="text-lg font-semibold mt-6 mb-2">3.1 Reglas de oro del equipo</h3>
            <Callout type="warning">
              <ol className="list-decimal list-inside space-y-1">
                <li><strong>SIEMPRE hacer <Code>git pull</Code> antes de empezar a trabajar</strong></li>
                <li><strong>NUNCA hacer push directo a <Code>main</Code> o <Code>develop</Code></strong> — siempre por PR</li>
                <li><strong>NUNCA hacer <Code>git push --force</Code></strong> salvo que sepas exactamente qué estás haciendo</li>
                <li><strong>Commits chicos y frecuentes</strong> — mejor 10 commits chicos que 1 commit gigante</li>
                <li><strong>Nombres de branch descriptivos</strong> — que se entienda qué estás haciendo</li>
                <li><strong>Resolver conflictos YA</strong> — no dejar para después</li>
              </ol>
            </Callout>

            <h3 className="text-lg font-semibold mt-6 mb-2">3.2 Flujo visual</h3>
            <CodeBlock>{`main (producción — lo que ve el cliente)
  │
  └── develop (integración — acá se juntan las features)
       │
       ├── feature/login (Manuel trabaja acá)
       │     └── commit → commit → commit → PR a develop ✅
       │
       ├── feature/dashboard (Gabriel trabaja acá)
       │     └── commit → commit → PR a develop ✅
       │
       └── fix/error-api (Bruno trabaja acá)
             └── commit → PR a develop ✅

Cuando develop está estable → se mergea a main → deploy automático`}</CodeBlock>

            <h3 className="text-lg font-semibold mt-6 mb-2">3.3 Resolver conflictos de merge</h3>
            <CodeBlock>{`# Si al hacer merge ves "CONFLICT", no entres en pánico:

# 1. Git te marca los archivos con conflicto
git status  # Muestra archivos en rojo

# 2. Abrí cada archivo con conflicto. Vas a ver algo así:
<<<<<<< HEAD
codigo tuyo
=======
codigo del otro
>>>>>>> develop

# 3. Elegí qué código queda (puede ser uno, otro, o ambos)
#    Borrá las líneas de <<<<<<, =======, >>>>>>>

# 4. Guardá el archivo, después:
git add .
git commit -m "merge: resolver conflictos"
git push`}</CodeBlock>

            <h3 className="text-lg font-semibold mt-6 mb-2">3.4 Proteger branches en GitHub</h3>
            <p className="text-sm mb-2">Configurar en GitHub → Repo → Settings → Branches → Branch protection rules:</p>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold">Para <Code>main</Code>:</p>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5 text-muted-foreground">
                  <li>Require a pull request before merging</li>
                  <li>Require approvals: 1</li>
                  <li>Require status checks to pass</li>
                  <li>Do not allow bypassing the above settings</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold">Para <Code>develop</Code>:</p>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5 text-muted-foreground">
                  <li>Require a pull request before merging</li>
                  <li>Require approvals: 1</li>
                </ul>
              </div>
            </div>
          </section>

          {/* ─── PART 4 ─── */}
          <section id="emergencia" className="mb-12">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b">4. Comandos de Emergencia</h2>
            <CodeBlock>{`# "Hice un commit pero me olvidé de agregar un archivo"
git add archivo-olvidado.tsx
git commit --amend --no-edit  # Agrega al último commit sin cambiar mensaje

# "Quiero deshacer mi último commit (pero mantener los cambios)"
git reset --soft HEAD~1

# "Quiero descartar TODOS mis cambios locales"
git checkout -- .
# ⚠️ CUIDADO: esto borra cambios no commiteados

# "Quiero ver el historial de commits"
git log --oneline --graph

# "Quiero guardar mis cambios temporalmente sin commitear"
git stash           # Guarda los cambios
git stash pop       # Recupera los cambios

# "Quiero ver quién escribió cada línea de un archivo"
git blame archivo.tsx`}</CodeBlock>
          </section>

          {/* ─── PART 5 ─── */}
          <section id="recursos" className="mb-12">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b">5. Recursos de Aprendizaje</h2>

            <h3 className="text-lg font-semibold mt-6 mb-3">Videos recomendados (Español)</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border">
                <thead><tr className="bg-muted/50"><th className="text-left p-2 border-b">Tema</th><th className="text-left p-2 border-b">Video</th><th className="p-2 border-b">Duración</th></tr></thead>
                <tbody>
                  <tr className="border-b"><td className="p-2">Git desde cero</td><td className="p-2"><ExternalLink href="https://www.youtube.com/watch?v=3GymExBkKjE">midudev — Git y GitHub desde CERO</ExternalLink></td><td className="p-2 text-center">50 min</td></tr>
                  <tr className="border-b"><td className="p-2">Git para principiantes</td><td className="p-2"><ExternalLink href="https://www.youtube.com/watch?v=VdGzPZ31ts8">HolaMundo — Aprende Git ahora</ExternalLink></td><td className="p-2 text-center">60 min</td></tr>
                  <tr className="border-b"><td className="p-2">GitHub Flow</td><td className="p-2"><ExternalLink href="https://www.youtube.com/watch?v=BYKdepIqw0c">Fazt — Flujo de trabajo en GitHub</ExternalLink></td><td className="p-2 text-center">25 min</td></tr>
                  <tr className="border-b"><td className="p-2">Resolver conflictos</td><td className="p-2"><ExternalLink href="https://www.youtube.com/watch?v=9YJgKyIAXM4">midudev — Conflictos en Git</ExternalLink></td><td className="p-2 text-center">15 min</td></tr>
                  <tr><td className="p-2">Git branches</td><td className="p-2"><ExternalLink href="https://www.youtube.com/watch?v=gjx-ksqVaFA">Fazt — Ramas en Git explicadas</ExternalLink></td><td className="p-2 text-center">20 min</td></tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold mb-3">Videos recomendados (Inglés)</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border">
                <thead><tr className="bg-muted/50"><th className="text-left p-2 border-b">Tema</th><th className="text-left p-2 border-b">Video</th><th className="p-2 border-b">Duración</th></tr></thead>
                <tbody>
                  <tr className="border-b"><td className="p-2">Git completo</td><td className="p-2"><ExternalLink href="https://www.youtube.com/watch?v=RGOj5yH7evk">freeCodeCamp — Git Full Course</ExternalLink></td><td className="p-2 text-center">60 min</td></tr>
                  <tr className="border-b"><td className="p-2">Git para equipos</td><td className="p-2"><ExternalLink href="https://www.youtube.com/watch?v=Uszj_k0DGsg">freeCodeCamp — Git for Professionals</ExternalLink></td><td className="p-2 text-center">40 min</td></tr>
                  <tr><td className="p-2">Pull Requests</td><td className="p-2"><ExternalLink href="https://www.youtube.com/watch?v=8lGpZkjnkt4">Jake Vanderplas — PR Tutorial</ExternalLink></td><td className="p-2 text-center">15 min</td></tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold mb-3">Recursos interactivos</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li><ExternalLink href="https://learngitbranching.js.org/?locale=es_AR">Learn Git Branching</ExternalLink> — Tutorial interactivo visual (tiene versión en español)</li>
              <li><ExternalLink href="https://skills.github.com/">GitHub Skills</ExternalLink> — Cursos oficiales de GitHub</li>
              <li><ExternalLink href="https://ohmygit.org/">Oh My Git!</ExternalLink> — Videojuego para aprender Git</li>
              <li><ExternalLink href="https://education.github.com/git-cheat-sheet-education.pdf">Git Cheat Sheet (PDF)</ExternalLink> — Hoja de referencia rápida oficial de GitHub</li>
            </ul>
          </section>

          {/* ─── PART 6 ─── */}
          <section id="checklist" className="mb-12">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b">6. Checklist de Verificación</h2>
            <p className="text-sm text-muted-foreground mb-4">Antes de considerarte "listo" para colaborar en proyectos, verificá que podés hacer todo esto:</p>
            <div className="space-y-2">
              {[
                "Tengo Git instalado y configurado con mi nombre y email",
                "Tengo cuenta de GitHub con 2FA activado",
                "Tengo SSH key configurada y funcionando",
                "Puedo clonar un repositorio de la organización MGB",
                "Puedo crear una branch nueva desde develop",
                "Puedo hacer commits con mensajes descriptivos",
                "Puedo subir (push) mi branch a GitHub",
                "Puedo crear un Pull Request en GitHub",
                "Puedo revisar y aprobar el PR de otro socio",
                "Puedo hacer merge de develop a mi branch",
                "Puedo resolver un conflicto de merge básico",
                "Conozco los comandos de emergencia (stash, reset, amend)",
              ].map((item, i) => (
                <label key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer text-sm">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-input" />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
