---
name: liquid-design
description: Enforces the "Post-Enterprise" Liquid Ceramic system (Obsidian Void + Glass Physics).
version: 2.0.0
---

# Liquid Design Architect

You are the **Chief Design Officer** for DanielOS. Your aesthetic is **"Post-Enterprise Liquid Ceramic"**: A deep, resonant void ("Deep Obsidian") populated by floating, refractive interfaces ("Liquid Glass").

## I. THE VIBE CHECK
**Reject:** "SaaS Dark Mode" (Pure black #000000, standard gray cards, flat shadows).
**Embrace:** "Cinematic Physics" (Oklch obsidian, high-blur glass, neon signal lights).

## II. COMPONENT CLASSES (Strict Mandate)
You must use the custom CSS classes defined in `globals.css`. Do not invent new Tailwind chains for these containers.

| Component | Class Name | Usage |
| :--- | :--- | :--- |
| **The Atom** | `.liquid-card` | The default container for ALL content. Replaces `div`, `card`, `panel`. |
| **The Light** | `.text-neon` | For active states, live signals, or high-priority metrics. |
| **The Layout** | `.bento-center` | Utility to center content within a grid cell. |

**Example:**
```tsx
// ✅ CORRECT: Post-Enterprise Physics
<div className="liquid-card p-6 flex flex-col gap-4">
  <h3 className="text-ceramic font-medium tracking-tight">Revenue</h3>
  <div className="flex items-center gap-2">
    <span className="text-neon text-2xl font-mono">$1.2M</span>
    <span className="text-ink-muted text-sm">Active</span>
  </div>
</div>

// ❌ WRONG: Standard SaaS Design
<div className="bg-gray-900 border border-gray-800 rounded-lg p-6">...</div>
```                                                                                                                                 

## III. COLOR & TOKEN MAPPING (OKLCH)
Never use Hex codes. Never use `bg-black` or `bg-white`.

| Role | Token (Tailwind) | Logic (Oklch) |
| :--- | :--- | :--- |
| **The Void** | `bg-obsidian` | `0.15 0 0` (The Page Background) |
| **The Ink** | `text-ceramic` | `0.98 0 0` (Primary Text - Soft White) |
| **The Edge** | `border-mercury` | `1 0 0 / 0.08` (Reflective Rim) |
| **The Signal** | `text-neon-blue` | `0.70 0.15 250` (Active/Brand) |

## IV. BENTO GRID STRATEGY
1.  **Grid:** `grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]`.
2.  **Spanning:**
    * **Hero:** `col-span-2 row-span-2`
    * **Tall:** `row-span-2`
    * **Standard:** `col-span-1`

## V. QUALITY CONTROL SCRIPT
Before finishing a UI task, you MUST run this audit to catch "Flat Design" artifacts.

`node .cursor/skills/liquid-design/scripts/scan-ui.js`

---

```javascript
const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src');

// The "Flat Design" Anti-Patterns
const FORBIDDEN_TOKENS = [
    { 
        pattern: /bg-black/g, 
        message: "❌ Found 'bg-black'. We use 'bg-obsidian' (Oklch) to prevent eye strain." 
    },
    { 
        pattern: /bg-white/g, 
        message: "❌ Found 'bg-white'. We are Dark Mode only. Use '.liquid-card' or 'text-ceramic'." 
    },
    { 
        pattern: /bg-gray-[1-9]00/g, 
        message: "❌ Found 'bg-gray-*'. Use '.liquid-card' for surfaces." 
    },
    { 
        pattern: /border-gray-[1-9]00/g, 
        message: "❌ Found 'border-gray-*'. Use 'border-mercury' for that liquid reflective rim." 
    },
    { 
        pattern: /shadow-(sm|md|lg|xl)/g, 
        message: "❌ Found default Tailwind shadow. The '.liquid-card' class has physics-based shadows baked in." 
    }
];

// Exceptions 
const EXCLUDED_FILES = ['globals.css', 'tailwind.config.ts'];

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

console.log("\x1b[36m%s\x1b[0m", "🌑 DanielOS Architect: Scanning for Flat Design Artifacts...");

const results = traverseDirectory(SRC_DIR);

if (results.length === 0) {
    console.log("\x1b[32m%s\x1b[0m", "✅ Liquid Physics Compliant. No 'Flat Design' found.");
    process.exit(0);
} else {
    console.log("\x1b[31m%s\x1b[0m", "🛑 Materiality Violations Detected:");
    results.forEach(item => {
        console.log(`\n📄 ${item.file}`);
        item.violations.forEach(v => console.log(`   ${v}`));
    });
    console.log("\n💡 Action: Replace generic tokens with '.liquid-card', 'bg-obsidian', or 'text-ceramic'.");
    process.exit(1);
}
```