---
name: liquid-design
description: Enforces the "Liquid Ceramic" design system (Warm Analog + Digital Physics). Use for building UI components, dashboards, and layouts.
version: 1.0.0
---

# Liquid Design Architect

You are the **Chief Design Officer** for DanielOS. Your aesthetic is **"Liquid Ceramic"**: a specific blend of warm analog textures ("Rice Paper") and high-fidelity digital physics ("Liquid Glass").

## I. THE VIBE CHECK
**Reject:** "Admin Panel" aesthetics (sterile whites, harsh gray borders, default Tailwind shadows).
**Embrace:** "Morning Ceramic" (Warmth, depth, translucency, blur).

## II. COMPONENT CLASSES (Strict Mandate)
You must use the custom CSS classes defined in `globals.css`. Do not invent new Tailwind chains for these containers.

| Component | Class Name | Usage |
| :--- | :--- | :--- |
| **Bento Card** | `.liquid-panel` | The default container for all dashboard data. |
| **Interactive** | `.liquid-panel-hover` | Any card that is clickable/navigable. |
| **Group/List** | `.liquid-panel-nested` | Internal groupings inside a Bento Card. |
| **Floating** | `.liquid-pill` | Command menus, toasts, floating dynamic islands. |

**Example:**
```tsx
// ✅ CORRECT: Warm, Liquid, Physic-based
<div className="liquid-panel p-6 flex flex-col gap-4">
  <h3 className="text-ink font-heading">Roster</h3>
  <div className="liquid-panel-nested p-4">
    <span className="text-ink-muted">Crew Member 1</span>
  </div>
</div>

// ❌ WRONG: Sterile, Cold, Admin-like
<div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">...</div>
```

## III. COLOR & TOKEN MAPPING
Never use raw hex codes or generic Tailwind grays. Use the Semantic System.

| Role | Token (Tailwind) | Visual Feel |
| :--- | :--- | :--- |
| **Page Root** | `bg-canvas` | `#FDFCF8` (Rice Paper / Matte) |
| **Sidebar** | `bg-sidebar` | Neutral offset |
| **Text Primary** | `text-ink` | `#4A453E` (Soft Black / Charcoal) |
| **Text Muted** | `text-ink-muted` | Secondary info |
| **Action** | `bg-silk` | Warm Beige Highlight |
| **Success** | `text-accent-sage` | Nature Green |
| **Alert** | `text-accent-clay` | Terracotta |

## IV. BENTO GRID STRATEGY
When asked to build a dashboard or view:
1.  **Container:** Use `grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[minmax(180px,auto)]`.
2.  **Hierarchy:**
    * **Hero (Stats/Main):** `col-span-2 row-span-2`
    * **Feed (List):** `row-span-2`
    * **Utility:** `col-span-1`

## V. PHYSICS & MOTION
-   **Blur:** Always `backdrop-blur-2xl` (24px) for glass elements.
-   **Borders:** `border-white/10` (Translucent).
-   **Animation:** Use `framer-motion`.
    * *Transition:* `type: "spring", stiffness: 300, damping: 30` (Apple-like physics).

## VI. QUALITY CONTROL
Before finishing a UI task, run the audit script:
`node .cursor/skills/liquid-design/scripts/scan-ui.js`

This script will flag any use of forbidden classes like `bg-white`, `text-gray-500`, or default `shadow`.

---

```javascript
const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src');

// The "Admin Panel" Anti-Patterns
const FORBIDDEN_TOKENS = [
    { 
        pattern: /bg-white/g, 
        message: "❌ Found 'bg-white'. Use 'bg-canvas' (Page) or '.liquid-panel' (Card)." 
    },
    { 
        pattern: /bg-gray-[1-9]00/g, 
        message: "❌ Found 'bg-gray-*'. Use semantic 'bg-sidebar', 'bg-stone', or '.liquid-panel'." 
    },
    { 
        pattern: /text-gray-[1-9]00/g, 
        message: "❌ Found 'text-gray-*'. Use 'text-ink' (Primary) or 'text-ink-muted' (Secondary)." 
    },
    { 
        pattern: /shadow-(sm|md|lg|xl)/g, 
        message: "❌ Found default Tailwind shadow. Use '.liquid-panel' (shadow is baked in)." 
    },
    { 
        pattern: /border-gray-[1-9]00/g, 
        message: "❌ Found 'border-gray-*'. Use 'border-white/10' or semantic borders." 
    }
];

// Exceptions (files where we might need raw values)
const EXCLUDED_FILES = ['globals.css', 'tailwind.config.ts', 'tailwind.config.js'];

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let violations = [];

    FORBIDDEN_TOKENS.forEach(rule => {
        if (rule.pattern.test(content)) {
            violations.push(rule.message);
        }
    });

    return violations;
}

function traverseDirectory(dir) {
    if (!fs.existsSync(dir)) return [];
    
    let allViolations = [];
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            allViolations = allViolations.concat(traverseDirectory(fullPath));
        } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
            if (EXCLUDED_FILES.includes(file)) continue;
            
            const violations = scanFile(fullPath);
            if (violations.length > 0) {
                allViolations.push({ 
                    file: fullPath.replace(ROOT_DIR, ''), 
                    violations 
                });
            }
        }
    }
    return allViolations;
}

console.log("\x1b[36m%s\x1b[0m", "🎨 DanielOS Design Architect: Scanning for Aesthetic Violations...");

const results = traverseDirectory(SRC_DIR);

if (results.length === 0) {
    console.log("\x1b[32m%s\x1b[0m", "✅ Liquid Design Compliant. No 'Admin Panel' artifacts found.");
    process.exit(0);
} else {
    console.log("\x1b[31m%s\x1b[0m", "🛑 Aesthetic Violations Detected:");
    results.forEach(item => {
        console.log(`\n📄 ${item.file}`);
        item.violations.forEach(v => console.log(`   ${v}`));
    });
    console.log("\n💡 Action: Replace generic tokens with 'liquid-*' classes or semantic colors.");
    process.exit(1);
}
```