import express from 'express';
import pool from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const [results] = await pool.query('CALL sp_GetFavorites(?)', [req.user.id]);
    const favorites = results[0].map(row => row.pokemon_id);
    res.status(200).json(favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const { pokemon_id } = req.body;
  try {
    await pool.query('CALL sp_AddFavorite(?, ?)', [req.user.id, pokemon_id]);
    res.status(201).json({ message: 'Agregado a favoritos' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:pokemon_id', requireAuth, async (req, res) => {
  const { pokemon_id } = req.params;
  try {
    await pool.query('CALL sp_RemoveFavorite(?, ?)', [req.user.id, parseInt(pokemon_id)]);
    res.status(200).json({ message: 'Eliminado de favoritos' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
