"use strict"
var fs = require('fs');
var path = require('path');
var watchList = [];
var gaze = require('gaze');
var appDir = process.cwd();
var co = require('co');
const convert = require('koa-convert')
const CONFIGS = require('@dp/node-server/lib/config');
const DEFAULT_METHODS = ['get', 'post'];
var colors = require('colors');
module.exports = function (app) {
    if(app.env!='development') return;
    // 延时3秒后开始监听文件变化(需要等到 node-server 启动完毕)
    setTimeout(function() {
        //扫描ACTION文件夹
        scanDir('./action', callback, app);
        scanDir('./config', callback, app);
    }, 3000);
};
function scanDir(directory, fileOpt, app) {
    fs.readdirSync(path.resolve(CONFIGS.APP_ROOT, directory)).forEach(function(file) {
        const pathname = path.resolve(CONFIGS.APP_ROOT, path.join(directory, file));
        //是文件我才处理,文件夹继续扫描
        if (fs.statSync(pathname).isFile()) {
            fileOpt(pathname, app);
        } else {
            scanDir(pathname, fileOpt, app);
        }
    });
}
var callback = function (pathname,app) {
    watchFsAndChildren(pathname, async function () {
        if(app)  {
            //重写一遍路由初始化,把旧的从middleware里删掉,新的加进去
            var router = require('koa-router')();
            await initFilter(app,router);
            await initRouter(app,router);
            router.get('/index.html', function* (next) {
                this.body = 'hello ' + CONFIGS.SERVER_CONFIG.name;
            });
            for (let i = 0; i < app.middleware.length; i++) {
                if (!!app.middleware[i].router) {
                    app.middleware[i] = router.routes();
                    return;
                }
            }
        }
    });
};
//监听文件及它的所依赖的模块文件
function watchFsAndChildren(pathname, app) {
    let flag = true;
    watchList.forEach(function(path) {
        if (path === pathname) flag = false;
    });
    if (flag) {
        const list = [];
        list.push(pathname);
        gaze(pathname, function(err, watcher) {
            this.on('changed', function(filepath) {
                if (filepath.indexOf('/config/pigeon.js') > -1) {
                    console.log('you seem changed the pigeon config file, Please reload the whole nodejs process manully'.red);
                }
                cleanCache(filepath, app);
                cleanDone();
            });
        });
        let children = [];
        try {
            children = require.cache[pathname].children;
        }
        catch (e) {
            children = [];
        }
        if (children && children.length) {
            children.forEach(function(child) {
                let flag = true;
                watchList.forEach(function(path) {
                    if (path === child.filename) flag = false;
                });
                if (flag && !child.filename.match(/node_modules/)) {
                    watchFsAndChildren(child.filename, app);
                }
            });
        }
        watchList.concat(list);
    }
}
function cleanCache(pathname, app) {
    //从下到上杀缓存,必须先杀子模块的再杀父模块的,一条线全杀光。。
    // Double kill. / Triple kill. / Quadro kill. / Penta kill / Legendary!
    let module = require.cache[pathname];
    delete require.cache[pathname];
    console.log(`cache update ${pathname}`.green);
    if (module && module.parent) {
        if (!module.parent.id.match(/node_modules/)) cleanCache(module.parent.id, app);
        module.parent.children.splice(module.parent.children.indexOf(module), 1);
    }
    app();
}
//copy from @dp/node-server
function initRouter(app,router) {
    let routerConfigFile = CONFIGS.ROUTER_CONFIG_FILE
    let actionDir = CONFIGS.ACTION_DIR
    let routerConfigs = {}
    let routerConfig
    let routerConfigArr
    let methods
    let actions
    let cmd
    // 支持单文件和多文件配置
    if (fs.existsSync(routerConfigFile + '.js')) {
        // 单文件
        routerConfigs = require(routerConfigFile)
    } else if (fs.existsSync(routerConfigFile)) {
        // 多文件
        fs.readdirSync(routerConfigFile).forEach((file) => {
            Object.assign(routerConfigs, require(path.join(routerConfigFile, file)))
        })
    } else {
        app.logger.error('Router config file "' + routerConfigFile + '" not found!')
    }
    Object.keys(routerConfigs).forEach((routerPath) => {
        routerConfig = routerConfigs[routerPath]
        routerConfigArr = Array.isArray(routerConfig) ? routerConfig : [routerConfig]
        routerConfigArr.forEach((rc) => {
            methods = rc.methods || DEFAULT_METHODS
            methods = Array.isArray(methods) ? methods : [methods]
            actions = typeof rc !== 'object' ? rc : rc.actions
            actions = Array.isArray(actions) ? actions : [actions]
            actions = actions.map((action) => {
                action = action.split('!')
                cmd = action[1]
                action = action[0]
                try {
                    action = require(path.join(actionDir, action))
                } catch (e) {
                    console.log('init action ', action, 'fail')
                    throw e
                }
                if (cmd) {
                    cmd = cmd.split('.')
                    while (cmd.length) {
                        action = action[cmd[0]]
                        cmd = cmd.splice(1)
                    }
                }
                // 兼容 GeneratorFunction action
                action = convert(action)
                return action
            })
            actions.unshift(async function middleware(ctx, next) {
                ctx._routerPath = routerPath
                await next()
            })
            router.register(routerPath, methods, actions)
        })
    })
    return router;
}
/**
 * 将配置项转化为数组
 * @param  {[string]} config 字符串或数组
 * @return {Array}  数组
 */
function toArray(config) {
    return Array.isArray(config) ? config : [config]
}
async function initFilter(app,router) {
    let filterConfigFile = CONFIGS.FILTER_CONFIG_FILE
    let filterConfigs = {}
    let methods
    let matches
    let excludes
    let filters
    let inits
    let actions
    // 支持单文件配置
    if (fs.existsSync(filterConfigFile)) {
        // 单文件
        filterConfigs = require(filterConfigFile)
    } else {
        app.logger.warn('Filter config file "' + filterConfigFile + '" not found!')
        return
    }
    for (let filterConfig of filterConfigs) {
        methods = toArray(filterConfig.methods || DEFAULT_METHODS)
        matches = toArray(filterConfig.match || [])
        excludes = toArray(filterConfig.exclude || [])
        filters = toArray(filterConfig.filters || [])
        inits = []
        actions = []
        filters.forEach((filter) => {
            if (typeof filter === 'object' && filter.init && filter.middleware) {
                inits.push(convert(filter.init))
                actions.push(convert(filter.middleware))
            } else {
                actions.push(convert(filter))
            }
        })
        await Promise.all(inits.map(init => init()))
        router.register(matches, methods, actions, {
            excludes: excludes
        })
    }
}
//缓存已清光,回调
function cleanDone() {
    console.log('hot reload done!'.green);
}


