const Menu = require('../../models/menu')
const fallbackMenus = require('../../../menus.json')
function homeController() {
    return {
        async index(req, res) {
            const pizzas = await Menu.find()
            const itemsToRender = (Array.isArray(pizzas) && pizzas.length > 0) ? pizzas : fallbackMenus
            return res.render('home', { pizzas: itemsToRender })
        }
    }
}

module.exports = homeController