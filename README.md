# Rescue Radar App

This is the **Rescue Radar frontend web application**.  
It displays data about adoptable animals and rescue organizations, pulled from the Rescue Radar API server.

## 🚀 Project Setup

1️⃣ Install dependencies:

```bash
npm install
```

2️⃣ Start the app:

```bash
ng serve
```

By default, the app expects the backend API to be running at:

```
http://localhost:5000
```

The API base URL is configured using Angular's environment files:

- `src/environments/environment.ts` → local development
- `src/environments/environment.prod.ts` → production (optional)

For example, in `environment.ts`:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5000/api'
};
```

## 💬 Related Repositories

- [Rescue Radar API](https://github.com/pyohner/rescue_radar_api)
- [Petfinder Data Collector](https://github.com/pyohner/petfinder-data-collector)

---

## 🛠 Development Notes

- This project was built with Angular.
- Uses the Rescue Radar API to fetch live data from the Petfinder API.
- Update `apiBaseUrl` in `environment.ts` if backend URL changes.

## 🔗 Running Frontend + Backend Together

To run both apps locally:

1️⃣ Start the backend:

```bash
cd rescue-radar-api
python api_server.py
```

2️⃣ Start the frontend:

```bash
cd rescue-radar-app
ng serve
```

Make sure `apiBaseUrl` in `environment.ts` points to the backend URL:

```typescript
apiBaseUrl: 'http://localhost:5000/api'
```
