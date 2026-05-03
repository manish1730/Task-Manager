# Team Task Manager Frontend

Frontend for the Team Task Manager app built with React and Vite.

## Structure

```text
frontend/
├── public/
├── src/
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   └── dashboard/
│   │       └── Dashboard.jsx
│   ├── services/
│   │   └── api.js
│   ├── assets/
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── package.json
└── vite.config.js
```

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Notes

- API calls live in `src/services/api.js`
- Auth state lives in `src/context/AuthContext.jsx`
- Generated build output in `dist/` should not be committed
