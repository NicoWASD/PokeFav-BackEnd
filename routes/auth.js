import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import pool from '../config/db.js';

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_APP_PASSWORD,
  },
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const [results] = await pool.query('CALL sp_GetUserByEmail(?)', [email]);
    const existing = results[0];
    if (existing.length > 0) {
      return res.status(400).json({ error: 'El correo ya está registrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    await pool.query('CALL sp_RegisterUser(?, ?, ?, ?)', [name, email, hashedPassword, otp]);

    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: 'PokeFav - Código de Verificación',
      html: `<h2>¡Hola ${name}!</h2><p>Tu código de verificación es: <b>${otp}</b></p><p>Ingresa este código para activar tu cuenta.</p>`
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: 'Usuario registrado. Revisa tu correo para el código OTP.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.post('/verify', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const [results] = await pool.query('CALL sp_GetUserByEmail(?)', [email]);
    const users = results[0];
    if (users.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const user = users[0];
    if (user.is_verified) return res.status(400).json({ error: 'El usuario ya está verificado.' });
    
    if (user.otp_code !== otp) return res.status(400).json({ error: 'Código OTP inválido.' });

    await pool.query('CALL sp_VerifyUser(?)', [email]);

    res.status(200).json({ message: 'Cuenta verificada correctamente. Ya puedes iniciar sesión.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password, rememberMe } = req.body;
  try {
    const [results] = await pool.query('CALL sp_GetUserByEmail(?)', [email]);
    const users = results[0];
    if (users.length === 0) return res.status(401).json({ error: 'Credenciales inválidas.' });

    const user = users[0];
    if (!user.is_verified) return res.status(403).json({ error: 'Verifica tu cuenta primero.' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Credenciales inválidas.' });

    if (!process.env.JWT_SECRET) {
      console.error('[Auth Error] FATAL: JWT_SECRET no está configurado en .env');
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
    
    const expiresIn = rememberMe ? '30d' : '1d';
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: maxAge
    });

    res.status(200).json({ message: 'Inicio de sesión exitoso.', user: { name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;
  try {
    const [results] = await pool.query('CALL sp_GetUserByEmail(?)', [email]);
    const users = results[0];
    if (users.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const user = users[0];
    if (user.is_verified) return res.status(400).json({ error: 'El usuario ya está verificado.' });

    const otp = generateOTP();
    await pool.query('CALL sp_UpdateOTP(?, ?)', [email, otp]);

    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: 'PokeFav - Nuevo Código de Verificación',
      html: `<h2>¡Hola ${user.name}!</h2><p>Tu nuevo código de verificación es: <b>${otp}</b></p><p>Ingresa este código para activar tu cuenta.</p>`
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Código reenviado con éxito.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const [results] = await pool.query('CALL sp_GetUserByEmail(?)', [email]);
    const users = results[0];
    if (users.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
    
    const user = users[0];
    const otp = generateOTP();
    await pool.query('CALL sp_UpdateOTP(?, ?)', [email, otp]);

    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: 'PokeFav - Recuperación de Contraseña',
      html: `<h2>¡Hola ${user.name}!</h2><p>Tu código para recuperar tu contraseña es: <b style="font-size: 24px;">${otp}</b></p><p>Este código expira pronto. Si no fuiste tú, ignora este mensaje.</p>`
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Código de recuperación enviado.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const [results] = await pool.query('CALL sp_GetUserByEmail(?)', [email]);
    const users = results[0];
    if (users.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const user = users[0];
    if (user.otp_code !== otp) return res.status(400).json({ error: 'Código OTP inválido.' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('CALL sp_ResetPassword(?, ?)', [email, hashedPassword]);

    res.status(200).json({ message: 'Contraseña actualizada con éxito.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

export default router;
