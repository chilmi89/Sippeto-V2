# SiPetto Design System Memory

Dokumen ini menyimpan "ingatan" saya sebagai asisten koding mengenai pilihan desain dan warna core yang akan digunakan secara konsisten di sistem **SiPetto**.

## 🎨 Core Colors (Premium Palette)

Saya telah memilih palet warna yang memadukan kepercayaan (Trust) dan keramahan (Friendliness) yang cocok untuk ekosistem hewan peliharaan.

| Role | Color Name | Hex Code | Purpose |
| :--- | :--- | :--- | :--- |
| **Primary** | SiPetto Deep Blue | `#1E40AF` | Brand identity, main buttons, active states (Blue-800) |
| **Secondary** | SiPetto Cloud | `#71768B` | Secondary actions, inactive states, soft accents |
| **Accent** | Petto Purple | `#866E98` | Highlights, specialty icons, decorative elements |
| **Neutral** | Deep Slate | `#475569` | Text, borders, neutral surfaces (Slate-600) |
| **Safety** | Health Teal | `#10B981` | Success, healthy status |
| **Danger** | Urgent Rose | `#F43F5E` | Errors, urgent notices |
| **background** | Clean White | `#F8FAFC` | Main background (Slate-50) |

## 📐 Design Tokens (Tailwind 4 Variables)

Berikut adalah variabel CSS yang akan dipetakan ke dalam `globals.css`:

- `--brand-primary`: `#1E40AF`
- `--brand-secondary`: `#71768B`
- `--brand-accent`: `#866E98`
- `--brand-neutral`: `#475569`

## ✨ Visual Character
- **Rounded**: Menggunakan radius yang cukup besar (`rounded-2xl`) untuk memberikan kesan ramah.
- **Micro-interactions**: Transisi yang halus (`transition-all duration-300`) untuk elemen interaktif.
- **Glassmorphism**: Penggunaan efek blur dan transparansi tipis untuk card transisi yang premium.
