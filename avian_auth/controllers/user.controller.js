const {
    validateBody,
} = require('../middlewares/validator/validator')
const {
    login, register,
} = require('../schemas/user.schema');
const {BaseController} = require('../internal/avian_framework/controllers');

const { UserService} = require('../services');
const { UserValidator } = require('../validators');
const { UserModel } = require('../models');


class UserController extends BaseController{
    static run(app) {
        app.get('/v1/users', this.handler('getList'));
        app.post('/v1/users/login', validateBody(login), this.handler('login'));
        app.post('/v1/users/register', validateBody(register), this.handler('register'));
        app.post('/v1/users/logout', this.handler('logout'));
    }

    async getList(req, res, next) {
        try {
            const users = await UserModel.find().lean();

            return res.json(users);
        } catch (error) {
            return next(error);
        }
    }
    async login(req, res, next){
        try {
            const validateBody = await UserValidator.validateLogin({ body: req.body });
            const login = await UserService.handleLogin({ user: validateBody, req })
            return res.json(login)
        } catch (error) {
            next(error)
        }
    }

    async register(req, res, next){
        try {
            const body = req.body;
            await UserValidator.isValidUser({ body });
            const user = await UserService.handleRegister({ body });
            return res.status(201).json(user);
        } catch (error) {
            return next(error)
        }
    }

}


module.exports = UserController;
