# Online Debate Platform

## Setup Instructions

### Prerequisites
- Python (latest version)
- PostgreSQL
- Redis

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/debate-platform.git
   cd debate-platform
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure the `.env` file:
   ```plaintext
   SECRET_KEY=your-secret-key
   DEBUG=False
   ALLOWED_HOSTS=your-domain.com
   DATABASE_URL=postgres://username:password@localhost:5432/debate_platform
   CHANNEL_LAYERS={
       "default": {
           "BACKEND": "channels_redis.core.RedisChannelLayer",
           "CONFIG": {
               "hosts": [("127.0.0.1", 6379)],
           },
       },
   }
   ```

5. Apply migrations:
   ```bash
   python manage.py migrate
   ```

6. Run the development server:
   ```bash
   python manage.py runserver
   ```

### Running the ASGI Server
1. Install `daphne`:
   ```bash
   pip install daphne
   ```

2. Run the ASGI server:
   ```bash
   daphne -b 0.0.0.0 -p 8000 config.asgi:application
   ```

### Verify and update README

### Additional Notes
- Ensure `.env` file is properly configured for production.
- PostgreSQL is used for production-like development.
- Redis is required for Channels.

### API Documentation
- Swagger UI is accessible at `/api/docs/`.
- OpenAPI schema is accessible at `/api/schema/`.

### Templates
- Custom Swagger UI template is available in `templates/swagger_ui.html`.

### Example API Usage
#### User Registration
```bash
POST /api/users/register/
{
    "username": "example",
    "password": "password123",
    "role": "STUDENT"
}
```

#### User Login
```bash
POST /api/users/login/
{
    "username": "example",
    "password": "password123"
}
```

#### User Logout
```bash
POST /api/users/logout/
{
    "refresh": "your-refresh-token"
}
```