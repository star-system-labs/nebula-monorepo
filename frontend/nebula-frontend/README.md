# Nebula Frontend

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

## Web Component Deployment
To build and deploy Nebula as a web component for embedding in Webflow:

1. Build the web component:
```
npm run prepare:webcomponent
```

2. Deploy:
   - Manual Deploy:
     - Use the `dist` folder

3. After deployment, embed:
   - Add this code:
   ```html
   <script src="https://nebula.starsystemlabs.com/js/nebula-app.min.js"></script>
   <nebula-app></nebula-app>
   ```


