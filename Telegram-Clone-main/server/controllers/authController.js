const User = require("../models/User");
const ReqError = require("../utilities/ReqError");
const jwt = require("jsonwebtoken");
const catchAsyncError = require("../utilities/catchAsyncError");

const signToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const assignTokenToCookie = (user, res, statusCode) => {
  const token = signToken(user);

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    expires: new Date(
      Date.now() + parseInt(process.env.JWT_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
  };

  // Hata durumunda mesajı göster
  try {
    res.cookie("telegramToken", token, cookieOptions);
    res.cookie("userId", user._id);

    user.password = undefined;

    res.status(statusCode).json({
      status: "success",
      data: {
        token,
        user,
      },
    });
  } catch (error) {
    console.error("Token ve cookie ayarlama hatası:", error);
    return next(new ReqError(500, "Token ve cookie ayarlama hatası"));
  }
};

exports.login = catchAsyncError(async (req, res, next) => {
  const { username, password } = req.body;

  // Kullanıcı adı veya şifre eksikse hata mesajı
  if (!username || !password) {
    console.log("Kullanıcı adı veya şifre eksik.");
    return next(new ReqError(400, "Kullanıcı adı ve şifre gereklidir"));
  }

  try {
    const foundUser = await User.findOne({ username });

    // Kullanıcı adı bulunamadıysa hata mesajı
    if (!foundUser) {
      console.log("Kullanıcı adı bulunamadı.");
      return next(new ReqError(400, "Kullanıcı adı veya şifre hatalı"));
    }

    const passwordGivenCorrect = await foundUser.checkPasswordValidity(
      password,
      foundUser.password
    );

    // Şifre hatalıysa hata mesajı
    if (!passwordGivenCorrect) {
      console.log("Şifre hatalı.");
      return next(new ReqError(400, "Kullanıcı adı veya şifre hatalı"));
    }

    assignTokenToCookie(foundUser, res, 200);
  } catch (error) {
    console.error("Login sırasında hata:", error);
    return next(new ReqError(500, "Giriş işlemi sırasında bir hata oluştu"));
  }
});

exports.register = catchAsyncError(async (req, res, next) => {
  try {
    const newUser = await User.create(req.body);

    assignTokenToCookie(newUser, res, 201);
  } catch (error) {
    console.error("Kullanıcı kaydı sırasında hata:", error);
    return next(new ReqError(500, "Kullanıcı kaydederken bir hata oluştu"));
  }
});
