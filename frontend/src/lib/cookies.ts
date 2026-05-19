import Cookies from "js-cookie";

// access token
export const setToken = (token: string) => {
  Cookies.set("accessToken", token, { expires: 1 / 48 });
};

export const getToken = () =>
  Cookies.get("accessToken");

export const removeToken = () =>
  Cookies.remove("accessToken");

export const setRefreshToken = (token: string) => {
  Cookies.set("refreshToken", token, { expires: 7 });
};

export const getRefreshToken = () =>
  Cookies.get("refreshToken");

export const removeRefreshToken = () =>
  Cookies.remove("refreshToken");

export const setUserId = (id: number) => {
  Cookies.set("userId", id.toString(), {
    expires: 7,
  });
};

export const getUserId = () =>
  Cookies.get("userId");

export const removeUserId = () =>
  Cookies.remove("userId");