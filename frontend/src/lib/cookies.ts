import Cookies from 'js-cookie'

export const setToken = (token: string) => {
    Cookies.set('accessToken', token, { expires: 1/48 })
}

export const setUserId = (id: number) => {
    Cookies.set('userId', id.toString(), { expires: 1/48 })
}

export const removeUserId = () => Cookies.remove('userId')

export const getUserId = () => Cookies.get('userId')

export const getToken = () => Cookies.get('accessToken')

export const removeToken = () => Cookies.remove('accessToken')