<p align="center">
  <img src="./logo.png" alt="PokeFav Logo" width="150" />
</p>

<h1 align="center">PokeFav Backend</h1>

<p align="center">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/MariaDB-003545?style=for-the-badge&logo=mariadb&logoColor=white" alt="MariaDB" />
  <img src="https://img.shields.io/badge/JSON_Web_Tokens-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white" alt="JWT" />
</p>

## About The Project

PokeFav Backend serves as the robust REST API foundation for the PokeFav application. It handles secure user authentication, session management via HTTP-Only cookies, and business logic execution through SQL Stored Procedures. It is designed with a strong emphasis on data integrity and security against common web vulnerabilities.

## Key Features

* **Secure Authentication System:** JSON Web Tokens delivered strictly through HTTP-Only cookies to prevent Cross-Site Scripting (XSS) attacks.
* **Database Driven Logic:** Core business operations are handled safely using Stored Procedures in MariaDB, preventing SQL injection and abstracting logic.
* **Password Recovery Flow:** Integrated Nodemailer support to securely send and validate 6-digit One Time Passwords (OTP).
* **Robust Authorization:** Strict ownership validation mechanisms to prevent Insecure Direct Object References (IDOR) across all user data endpoints.

## Prerequisites

* Node.js (v16.x or higher recommended)
* npm or yarn package manager
* MariaDB Database Server
* SMTP credentials (for password recovery emails)

## Database Setup

1. Open your preferred database management tool (e.g., DBeaver).
2. Connect to your local or remote MariaDB instance.
3. Execute the script located at `DataBase/01_schema.sql` to generate the database structure.
4. Execute the script located at `DataBase/02_stored_procedures.sql` to load all the necessary business logic functions.

## Installation

1. Clone the repository.
2. Navigate to the backend directory.
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file at the root of the project with the following variables:
   ```env
   PORT=5000
   DB_HOST=your_database_host
   DB_USER=your_database_user
   DB_PASS=your_database_password
   DB_NAME=PokeFavDB
   JWT_SECRET=your_highly_secure_secret_string
   SMTP_HOST=your_smtp_server
   SMTP_PORT=your_smtp_port
   SMTP_USER=your_email_address
   SMTP_PASS=your_email_password
   ```
5. Start the server:
   ```bash
   npm run dev
   ```

## Security Overview

* **Passwords:** Hashed using `bcrypt` before storage.
* **Sessions:** Managed entirely on the server and verified via strictly scoped HTTP-Only cookies.
* **Rate Limiting / Anti-Spam:** Implemented on the password reset routes to prevent flooding and abuse.

## API Structure

* `routes/auth.js`: Handles registration, login, session persistence, and password resets.
* `routes/favorites.js`: Handles adding, removing, and listing favorite entities.
* `routes/teams.js`: Handles creation, deletion, and member management of custom teams.
