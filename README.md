# Qorvex Website

Company website for Qorvex — AI Automation, Business Websites, E-Commerce, Custom Software, Mobile Apps, and Cloud & Deployment support.

Static site (HTML, CSS, JavaScript) with no build step. 3D effects use [Three.js](https://threejs.org/) loaded from a CDN.

## Run locally

```bash
python -m http.server 5500
```

Then open http://localhost:5500.

## Structure

- `index.html` — page content
- `assets/css/styles.css` — styles and responsive layout
- `assets/js/main.js` — menu, animations, tilt effects, contact form
- `assets/js/hero3d.js` — 3D hero scene
- `assets/js/bg3d.js` — page-wide 3D particle wave background
- `assets/img/` — logo and favicon

## Contact form

Enquiries are emailed to `enquiry.qorvex@gmail.com` via [FormSubmit](https://formsubmit.co). The first submission from a new domain sends an activation email to that inbox, which must be confirmed once.

## Deploy

Hosted on Vercel, imported from this repository. Every push to `main` redeploys automatically.
