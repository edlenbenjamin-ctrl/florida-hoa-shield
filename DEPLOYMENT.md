# Deployment Instructions for GitHub Pages

## Overview
This document outlines the steps to deploy the Florida HOA Shield project using GitHub Pages. It includes configuration steps, custom domain setup, troubleshooting, and verification steps to ensure successful deployment.

### Prerequisites
- A GitHub account.
- Access to the repository: `edlenbenjamin-ctrl/florida-hoa-shield`.
- A configured static site (HTML, CSS, JS files).

## 1. Deployment Steps
### Step 1: Enable GitHub Pages
1. Go to the repository on GitHub.
2. Click on the **Settings** tab.
3. Scroll down to the **Pages** section.
4. In the **Source** dropdown, select the branch you want to use for GitHub Pages (e.g., `main` or `gh-pages`).
5. Choose the folder (usually `/ (root)` or `/docs`) that contains your static files.
6. Click **Save**. 

### Step 2: Custom Domain Setup (Optional)
1. In the **Pages** section, you can set a custom domain.
2. Enter your custom domain (e.g., `www.yourdomain.com`).
3. Configure your domain's DNS settings to point to GitHub Pages.
   - Add an A record pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, and `185.199.111.153`. 
   - Alternatively, set up a CNAME record pointing to `yourusername.github.io`.
4. After DNS propagation, check the box to enforce HTTPS for added security.

### Step 3: Pushing Updates
Whenever you update your site, commit the changes to your chosen branch. GitHub Pages will automatically keep your site in sync with the branch content.


## 2. Configuration Steps
- Ensure that your site’s files (HTML/CSS/JS) are structured correctly in the chosen folder.
- Use a `index.html` file as the entry point for your website.

## 3. Troubleshooting
- If your site does not appear, check the following:
  - Verify that your website’s files are in the correct branch/folder.
  - Check GitHub Pages settings to ensure the correct branch and folder are selected.
  - Ensure there are no build errors in your HTML/CSS/JS files.

## 4. Verification Steps
- Visit the GitHub Pages URL provided in the Pages settings.
- If using a custom domain, ensure to open your website through the custom domain URL.
- Check for any 404 errors or broken links and troubleshoot accordingly.

## Conclusion
By following these deployment instructions, you should be able to successfully set up GitHub Pages for your Florida HOA Shield project. If you encounter issues not covered here, please refer to the [GitHub Pages documentation](https://docs.github.com/en/pages) for further assistance.
