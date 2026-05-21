const express = require('express');
const ctrl = require('../controllers/ingredientController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', ctrl.list);
router.get('/allergens', ctrl.allergens);
router.get('/categories', ctrl.categories);
router.get('/substitutes', ctrl.listSubstitutes);
router.get('/:name', ctrl.getOne);

router.post('/', requireAuth, ctrl.create);
router.patch('/:name', requireAuth, ctrl.update);
router.delete('/:name', requireAuth, ctrl.remove);

router.post('/:name/allergens', requireAuth, ctrl.addAllergen);
router.delete('/:name/allergens/:allergen', requireAuth, ctrl.removeAllergen);

router.post('/:name/substitutes', requireAuth, ctrl.addSubstitute);
router.delete('/:name/substitutes/:target', requireAuth, ctrl.removeSubstitute);

module.exports = router;
