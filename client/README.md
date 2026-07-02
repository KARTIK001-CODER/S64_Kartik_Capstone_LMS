# LMS Frontend

React-based frontend for the Learning Management System.

## Tech Stack

- **React 19** with hooks and context API.
- **Vite 6** for fast development and optimized builds.
- **Tailwind CSS** for styling.
- **Lucide React** for icons.
- **Recharts** for educator dashboard charts.
- **React Router v7** for client-side routing.
- **Axios** for API requests.

## Structure

```
client/src/
├── assets/           # Static assets (images, SVGs)
├── components/       # Reusable UI components
│   ├── ui/           # Base UI kit (Card, Avatar, Badge, Button, Input)
│   ├── student/      # Student-specific components (CourseCard, Navbar, Footer)
│   └── educator/     # Educator-specific components (NavBar)
├── context/          # AppContext (global state: auth, courses, enrollments)
├── pages/            # Page components (lazy-loaded with React.lazy)
│   ├── student/      # Student pages (Dashboard, CourseDetails, Player, ...)
│   └── educator/     # Educator pages (Dashboard, MyCourses, Reports, ...)
└── index.css         # Tailwind directives and custom styles
```

## Routing

All pages except `Home`, `Login`, `Register`, `CoursesList`, and `Dashboard` are lazy-loaded with `React.lazy()` + `Suspense` for code splitting.

## State Management

- **AppContext** provides global state: user, courses, enrollments, notifications.
- Individual pages manage their own local state with `useState` and `useEffect`.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## Environment

The Vite dev server proxies `/api` requests to `http://localhost:5000` (configured in `vite.config.js`).

To connect to a production backend, set the `VITE_API_URL` environment variable.
