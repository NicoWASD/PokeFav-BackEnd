import express from 'express';
import pool from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const [teamsResults] = await pool.query('CALL sp_GetTeams(?)', [req.user.id]);
    const teams = teamsResults[0];
    
    for (let team of teams) {
      const [membersResults] = await pool.query('CALL sp_GetTeamMembers(?)', [team.id]);
      team.pokemons = membersResults[0].map(m => m.pokemon_id);
    }
    
    res.status(200).json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const { name } = req.body;
  try {
    const [results] = await pool.query('CALL sp_CreateTeam(?, ?)', [req.user.id, name]);
    const newTeam = results[0][0]; 
    res.status(201).json({ id: newTeam.team_id, name, pokemons: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('CALL sp_DeleteTeam(?, ?)', [req.user.id, parseInt(id)]);
    res.status(200).json({ message: 'Equipo eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/members', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { pokemon_id } = req.body;
  try {
    await pool.query('CALL sp_AddTeamMember(?, ?, ?)', [req.user.id, parseInt(id), pokemon_id]);
    res.status(201).json({ message: 'Miembro añadido' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/members/:pokemon_id', requireAuth, async (req, res) => {
  const { id, pokemon_id } = req.params;
  try {
    await pool.query('CALL sp_RemoveTeamMember(?, ?, ?)', [req.user.id, parseInt(id), parseInt(pokemon_id)]);
    res.status(200).json({ message: 'Miembro eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
