import VueRouter from 'vue-router'
import { isAdmin, isLoggedIn } from '@/utils/auth'
import { trackPageVisit } from '@/utils/visitTracker'

const router = new VueRouter({
    // mode: 'history', // 路由history模式，地址栏不会出现丑丑的 #
    routes: [
        {
            path: '/',
            component: () => import('@/views/home/index'),
            meta: {title: 'Home'}
        },
        {
            path: '/home',
            component: () => import('@/views/home/index'),
            meta: {title: 'Home'}
        },
        {
            path: '/phasei',
            component: () => import('@/views/phasei/index'),
            meta: {title: 'Phase I'}
        },
        {
            path: '/phaseii',
            component: () => import('@/views/phaseii/index'),
            meta: {title: 'Phase II'}
        },
        {
            path: '/database',
            component: () => import('@/views/database/index'),
            meta: {title: 'Database'}
        },
/*         {
            path: '/JBrowse',
            component: () => import('@/views/jbrowse/index'),
            meta: {title: 'JBrowse'}
        }, */
        {
            path: '/participants',
            component: () => import('@/views/participants/index'),
            meta: {title: 'Participants'}
        },
        {
            path: '/data',
            component: () => import('@/views/data/index'),
            meta: {title: 'Data'}
        },
        {
            path: '/publications',
            component: () => import('@/views/publications/index'),
            meta: {title: 'Publications'}
        },
        {
            path: '/conferenceTalks',
            component: () => import('@/views/conferenceTalks/index'),
            meta: {title: 'Conference Talks'}
        }, {
            path: '/news',
            component: () => import('@/views/news/index'),
            meta: {title: 'News'}
        }, {
            path: '/news/detail',
            component: () => import('@/views/news/detail'),
            meta: {title: 'Detail'}
        },
        {
            path: '/about',
            component: () => import('@/views/about/index'),
            meta: {title: 'About'}
        },
        {
            path: '/login',
            component: () => import('@/views/login/index'),
            meta: {title: 'Login'}
        },
        {
            path: '/register',
            component: () => import('@/views/login/index'),
            meta: {title: 'Register'}
        },
        {
            path: '/verify-email',
            component: () => import('@/views/login/verify-email'),
            meta: {title: 'Email verification'}
        },
        {
            path: '/forgot-password',
            component: () => import('@/views/login/forgot-password'),
            meta: {title: 'Forgot password'}
        },
        {
            path: '/reset-password',
            component: () => import('@/views/login/reset-password'),
            meta: {title: 'Reset password'}
        },
        {
            path: '/account',
            component: () => import('@/views/account/index'),
            meta: {title: 'Account', requiresLogin: true}
        },
        {
            path: '/admin',
            component: () => import('@/views/admin/index'),
            meta: {title: 'Admin', requiresAdmin: true}
        }
    ]
})
router.beforeEach((to, from, next) => {
    if (to.meta && to.meta.requiresLogin && !isLoggedIn()) {
        next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
        return
    }
    if (to.meta && to.meta.requiresAdmin && !isAdmin()) {
        const redirect = isLoggedIn() ? '/home' : `/login?redirect=${encodeURIComponent(to.fullPath)}`
        next(redirect)
        return
    }
    next()
})
// 全局后置路由守卫 用于更改页签标题
router.afterEach((to) => {
    const affix = 'CPC'
    const title = to.meta.title
    document.title = title ? `${title} - ${affix}` : affix
    window.setTimeout(() => trackPageVisit(to), 0)
})


export default router
