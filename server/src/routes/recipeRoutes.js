const express = require('express');
const ctrl = require('../controllers/recipeController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', ctrl.list);
router.get('/cuisines', ctrl.cuisines);
router.post('/preview-allergens', ctrl.previewAllergens);
router.post('/pantry-match', ctrl.pantryMatch);
router.get('/:id', ctrl.getOne);

router.post('/', requireAuth, ctrl.create);
router.put('/:id', requireAuth, ctrl.update);
router.delete('/:id', requireAuth, ctrl.remove);

router.post('/:id/like', requireAuth, ctrl.like);
router.delete('/:id/like', requireAuth, ctrl.unlike);

module.exports = router;
