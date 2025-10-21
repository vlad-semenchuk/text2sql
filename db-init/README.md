# Database Initialization

This directory contains scripts and data for initializing the PostgreSQL database.

## Setup dvdrental Sample Database

The PostgreSQL container is configured to automatically restore the dvdrental sample database on first startup.

### Steps:

1. **Get the dvdrental database file**

   If you don't have it yet, download from: https://www.postgresqltutorial.com/postgresql-getting-started/postgresql-sample-database/

2. **Extract the database file**

   ```bash
   # Extract dvdrental.tar from dvdrental.zip
   unzip dvdrental.zip
   ```

3. **Place the file in this directory**

   ```bash
   # Move dvdrental.tar to db-init/
   mv dvdrental.tar ./db-init/
   ```

4. **Start the containers**

   ```bash
   # Remove old PostgreSQL data and start fresh
   docker-compose down -v
   docker-compose up -d
   ```

5. **Verify the restoration**

   ```bash
   # Check the logs
   docker-compose logs postgres

   # You should see:
   # ✅ PostgreSQL is ready!
   # 📦 Creating dvdrental database...
   # 📥 Restoring dvdrental database from /tmp/dvdrental.tar...
   # ✅ Database dvdrental restored successfully!
   ```

### Connect to dvdrental Database

**Connection String:**
```
postgres://postgres:postgres@localhost:5432/dvdrental
```

**TablePlus Settings:**
- Host: `127.0.0.1` or `localhost`
- Port: `5432`
- User: `postgres`
- Password: `postgres`
- Database: `dvdrental`

### Database Schema

The dvdrental database contains the following tables:
- actor
- address
- category
- city
- country
- customer
- film
- film_actor
- film_category
- inventory
- language
- payment
- rental
- staff
- store

## Troubleshooting

**Database not restored?**

Check if `dvdrental.tar` exists in this directory:
```bash
ls -la db-init/dvdrental.tar
```

If missing, follow steps 1-3 above.

**Need to restore again?**

```bash
# Stop containers and remove volumes
docker-compose down -v

# Start again (restore script will run automatically)
docker-compose up -d
```

**View restoration logs:**

```bash
docker-compose logs -f postgres
```
