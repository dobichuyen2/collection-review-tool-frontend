# MediaCloud Collections Review App

A standalone web application for reviewing sources in MediaCloud collections and exporting decisions as CSV for ingestion by the MediaCloud web-search app.

## Features

- Manage multi-collection `ReviewProject`s (manager view)
- Seed a project from multiple MediaCloud `collection_id`s with deduped sources
- Seed collection names are stored and displayed on the project page
- Two-step project setup:
  - Step 1: start a `ReviewProject` (sources are fetched/stored at the project level)
  - Step 2: generate reviewer queues by entering `queue_count` on the project page
- Reviewer queues use derived status (queue is “completed” when exhausted; no manual completion needed)
- Queue cards show progress (based on undecided vs total)
- Persistent reviewer decisions (KEEP/REMOVE/ADD) and proposed new sources within the project
- Virtual queue pages for `skipped`, `added`, and `removed` sources (with empty-state messaging)
- Project-level editing controls:
  - editable project display name
  - toggle for “Edit source metadata in queues” (propagates to reviewer queues)
- Export a single aggregated project CSV (KEEP + ADD union across all reviewer queues)
- Clean, modern UI built with Svelte
- Reviewer queue cards include a full `Reviewer URL` that can be copied to clipboard (with brief checkmark feedback)

## Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- MediaCloud API key with read permissions for collections

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the project root (copy from `.env.example`):
```bash
cp .env.example .env
```

5. Edit `.env` and add your MediaCloud API key:
```
MEDIACLOUD_API_KEY=your_api_key_here
DATABASE_URL=sqlite:///reviews.db
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node dependencies:
```bash
npm install
```

## Running the Application

### Development Mode

1. **Start the backend server** (from the `backend` directory):
```bash
python app.py
```

The backend will run on `http://localhost:5000`

2. **Start the frontend development server** (from the `frontend` directory):
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` and proxy API requests to the backend.

3. Open your browser:
   - Manager interface (create/open review projects): `http://localhost:5173/manage`
   - Root landing page (static): `http://localhost:5173/`

### Demo build (V2 redesign preview)

The V2 redesign lives behind `/demo`. It runs entirely on mock data — no API key or running
backend required.

```bash
cd frontend
npm install
npm run dev
# open http://localhost:5173/demo
```

The demo route is **off by default**. To enable it, set:

```
VITE_DEMO_MODE=true
```

in `frontend/.env` or pass it to the dev server (`VITE_DEMO_MODE=true npm run dev`).
Without that flag, the app behaves exactly as the upstream — the `/demo` routes are
never registered and are not present in the production build.

See `BACKEND-GAPS.md` for a full accounting of what would need to be wired up before the
V2 UI can talk to the real backend.

### Production Build (Local)

1. **Build the frontend**:
```bash
cd frontend
npm run build
```

2. **Serve the built files** (you can use any static file server or configure Flask to serve them):
```bash
npm run preview
```

### Dokku Deployment

This project is designed to deploy to Dokku using helper scripts modeled after MediaCloud's `web-search` app ([`instance.sh`](https://github.com/mediacloud/web-search/blob/main/dokku-scripts/instance.sh), [`push.sh`](https://github.com/mediacloud/web-search/blob/main/dokku-scripts/push.sh)) and the simple Streamlit deploy script from SourceInspector ([`deploy-dokku.sh`](https://github.com/mediacloud/SourceInspector/blob/main/scripts/deploy-dokku.sh)).

#### Overview

- Backend (Flask) and frontend (Svelte) are deployed as a **single Dokku app**.
- Flask serves the built Svelte SPA from `frontend/dist` and exposes the API under `/api/*`.
- Dokku runs the app via a root-level `Procfile` using `gunicorn`.
- Environments are mapped from git branches:
  - `prod` branch → production instance
  - `staging` branch → staging instance
  - any other branch → per-developer instance (based on `$USER`)

#### Key Files

- `Procfile`
  - `web: cd backend && gunicorn "app:create_app()" --bind 0.0.0.0:$PORT --workers 3`
  - `release: cd backend && flask --app app:create_app db upgrade`
- `app.json`
  - Runs `npm ci && npm run build` in `frontend/` during Dokku's `predeploy` phase.
- `dokku-scripts/common.sh`
  - Shared config: `APP_BASE`, `DOKKU_GIT_REMOTE`, `FQDN`, `ALLOWED_HOSTS`, `PG_SVC`, etc.
- `dokku-scripts/instance.sh`
  - Creates/destroys Dokku apps and Postgres services for `prod`, `staging`, or a given username.
  - Sets up domains and the Dokku git remote.
- `dokku-scripts/push.sh`
  - Chooses the Dokku instance based on the current git branch.
  - Verifies the branch is pushed to its upstream (unless `--unpushed` is used).
  - Pushes the current branch to the Dokku app's `main` deploy branch.

#### One-Time Setup (per environment)

On a machine with SSH access to the Dokku host:

```bash
cd UNDP_collections_inspector

# Create production instance
dokku-scripts/instance.sh create prod

# Create staging instance
dokku-scripts/instance.sh create staging

# Optionally create a per-user dev instance
dokku-scripts/instance.sh create $USER
```

Then, on the Dokku host, configure any required environment variables, for example:

```bash
dokku config:set undp-collections-review-prod MEDIACLOUD_API_KEY=... SECRET_KEY=...
```

#### Deploying

1. Commit and push your changes to GitHub.
2. Check out the branch you want to deploy:
   - `prod` for production
   - `staging` for staging
   - any other branch for your per-user instance
3. Run:

```bash
./dokku-scripts/push.sh
```

This will:

- Verify the branch is pushed and in sync with its upstream (unless `--unpushed` is used).
- Push the branch to the Dokku remote for the appropriate app.
- Trigger a build that:
  - Installs backend dependencies and runs database migrations (`release` process).
  - Builds the frontend via `app.json`'s `predeploy` script.

## Usage

1. **Create a ReviewProject**
   - On the home page, enter one or more MediaCloud collection IDs (comma-separated).
   - Click **Start ReviewProject**.
   - Step 1 creates the project and fetches/dedupes sources (no reviewer queues yet).

2. **Generate reviewer queues (Step 2)**
   - Open the project page from the **Review Projects** table.
   - Enter `queue_count` and click **Generate queues**.
   - Reviewer queue links are then available to share with reviewers.

3. **Review via queue links**
   - Each queue page shows queue progress and reviewer actions (KEEP/REMOVE + proposing new sources).
   - A queue is considered **completed automatically** when it is exhausted (no undecided items remain).
   - When a reviewer queue is exhausted, the UI guides the next steps (propose a new source and review skipped sources).

4. **Review virtual queues (skipped/added/removed)**
   - The project page provides links to:
     - `Review skipped sources` (includes “skip for now” rotation)
     - `Review added sources` (table of added items)
     - `Review removed sources` (includes a `requeue` action to move back to skipped)

5. **Download the Project CSV**
   - Use **Download Project CSV** from the project page.
   - Export aggregates the union of **KEEP + ADD** decisions across all queues.

## API Endpoints

### Review Projects (manager)
- `POST /api/review-projects/start`
  - Body: `{ "collection_ids": [123, 456], "guidelines_template": "default", "edit_metadata": false, "name": "Optional project name" }`
  - Step 1: creates the project and stores deduped sources (no reviewer queues yet).

- `POST /api/review-projects/<project_guid>/queues`
  - Body: `{ "queue_count": 3 }`
  - Step 2: generates reviewer queues from the project’s stored sources.

- `PATCH /api/review-projects/<project_guid>/edit-metadata`
  - Body: `{ "edit_metadata": true | false }`
  - Updates the project setting and propagates to associated reviewer queues.

- `PATCH /api/review-projects/<project_guid>/name`
  - Body: `{ "name": "New project display name" }`

- `GET /api/review-projects`
  - Lists all projects with derived status and aggregated stats.

- `GET /api/review-projects/<project_guid>`
  - Returns project details + per-queue summaries (derived on read).

- `GET /api/review-projects/<project_guid>/export`
  - Exports a single aggregated project CSV (KEEP + ADD union across all queues; non-blocking).

- `POST /api/review-projects/<project_guid>/publish`
  - Publishes project decisions directly to MediaCloud using a user-provided API token.
  - First publish creates a target collection and stores it on the project; subsequent publishes sync that same collection.
  - JSON body may include `apply_metadata_updates_to_existing_sources` (boolean). When `true` and `MEDIACLOUD_PUBLISH_METADATA_UPDATES_ENABLED` is not disabled, KEEP/ADD rows with an existing `source_id` may PATCH `primary_language`, `pub_country`, and `pub_state` from review metadata. Sources created during the same publish run are not metadata-updated (create already carries metadata).

- `POST /api/review-projects/<project_guid>/publish/preview`
  - Runs token preflight and returns a no-write operation preview table for publish confirmation.
  - Accepts the same `apply_metadata_updates_to_existing_sources` flag; preview rows may include a `metadata_update` object when a PATCH would be attempted.
  - When metadata updates are requested, the preview calls the read-only Directory API per existing source and trims `metadata_update` to fields that differ from MediaCloud (`metadata_current`, `metadata_remote_status`, `metadata_desired` on rows). Summary: `metadata_updates_planned` counts only rows where the remote read succeeded and at least one field differs; `metadata_updates_skipped_unchanged` is already in sync; `metadata_remote_lookup_skipped` counts sources where the read failed (those rows may still carry a full desired patch for publish, but they are not included in `metadata_updates_planned`).

- `GET /api/review-projects/<project_guid>/skipped-items`
  - Virtual queue endpoint aggregating sources with `decision=skip` across all project queues.

- `GET /api/review-projects/<project_guid>/added-items`
  - Virtual queue endpoint aggregating sources with `decision=add` across all project queues.

- `GET /api/review-projects/<project_guid>/removed-items`
  - Virtual queue endpoint aggregating sources with `decision=remove` across all project queues.

### Reviewer Queues (GUID-based)
- `GET /api/review-queues/<queue_guid>`
  - Returns the queue plus derived status (completed when exhausted).

- `GET /api/review-queues/<queue_guid>/guidelines`
  - Returns rendered guidelines for the queue.

- `GET /api/review-queues/<queue_guid>/items`
  - Query params: `page`, `page_size`, `decision` (optional filter)
  - Returns queue items array and total count.

- `POST /api/review-queues/<queue_guid>/items/<item_id>/decide`
  - Body: `{ "decision": "keep" | "remove" | "add" }` (removal_reason optional when removing)
  - Returns updated item.

- `POST /api/review-queues/<queue_guid>/items`
  - Propose a new source inside the queue
  - Body: `{ "source_label": "Name", "source_homepage": "https://..." }`
  - Returns created item.

### Legacy single-collection reviews
The app still includes legacy `/api/reviews/*` endpoints, but the primary workflow is `ReviewProject`s.

## Database

### Development (SQLite)

The app uses SQLite by default for development. The database file (`reviews.db`) will be created automatically in the backend directory.

### Production (PostgreSQL)

To switch to PostgreSQL, update the `DATABASE_URL` in your `.env` file:

```
DATABASE_URL=postgresql://user:password@localhost/reviews_db
```

Make sure PostgreSQL is installed and the database exists before starting the application.

### Database Migrations

If you need to modify the database schema, you can use Flask-Migrate:

```bash
cd backend
flask db init  # First time only
flask db migrate -m "Description"
flask db upgrade
```

## Environment Variables

- `MEDIACLOUD_API_KEY` (required) - Your MediaCloud API key
- `MEDIACLOUD_UPLOAD_BASE_URL` (optional) - MediaCloud API base URL for write/publish operations (useful for staging/dev)
- `MEDIACLOUD_PUBLISH_ENABLED` (optional) - Enable/disable direct publish to MediaCloud from the app (`true` by default; set to `false` in prod to hide/disable)
- `MEDIACLOUD_PUBLISH_METADATA_UPDATES_ENABLED` (optional) - When `true` (default), publish requests may include `apply_metadata_updates_to_existing_sources` to PATCH `primary_language` / `pub_country` / `pub_state` on existing sources; set to `false` to disallow metadata writes regardless of client checkbox
- `MEDIACLOUD_SEARCH_BASE_URL` (optional) - Base URL for MediaCloud web links generated by backend/frontend (default: `https://search.mediacloud.org`)
- `DATABASE_URL` (optional) - Database connection string (defaults to SQLite)
- `FLASK_DEBUG` (optional) - Enable Flask debug mode (default: False)
- `SECRET_KEY` (optional) - Flask secret key for sessions (change in production)
- `VITE_MEDIACLOUD_SEARCH_BASE_URL` (optional, frontend build-time) - MediaCloud web base URL for collection/source links in the UI

## Project Structure

```
UNDP_collections_inspector/
├── backend/
│   ├── app.py              # Flask application
│   ├── models.py           # Database models
│   ├── config.py           # Configuration
│   ├── database.py         # Database setup
│   ├── routes/
│   │   └── api.py          # API endpoints
│   └── services/
│       └── mediacloud.py    # MediaCloud API client
├── frontend/
│   ├── src/
│   │   ├── routes/         # Page components
│   │   ├── components/     # Reusable components
│   │   └── lib/
│   │       └── api.js      # API client
│   └── package.json
└── README.md
```

## Troubleshooting

### MediaCloud API Errors

If you encounter errors fetching sources:
- Verify your `MEDIACLOUD_API_KEY` is correct
- Ensure the API key has read permissions for the collection
- Check that the collection ID exists in MediaCloud

### Database Errors

- Ensure the database file/directory is writable (SQLite)
- For PostgreSQL, verify connection credentials and database exists
- Check that all migrations are applied

### Frontend Not Connecting to Backend

- Ensure the backend is running on port 5000
- Check the Vite proxy configuration in `vite.config.js`
- Verify CORS is enabled in the Flask app

## License

This project is for internal use with MediaCloud.

## Support

For issues or questions, please refer to the MediaCloud documentation or contact your system administrator.
