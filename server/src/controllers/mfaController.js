const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const prisma = require('../config/db');

const setupMFA = async (req, res) => {
  try {
    const userId = req.user.userId;

    const secret = speakeasy.generateSecret({
      name: `SecureAuth (${req.user.email})`,
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: secret.base32,
      },
    });

    const qrCode = await qrcode.toDataURL(secret.otpauth_url);

    return res.status(200).json({
      success: true,
      message: 'MFA setup initiated',
      qrCode,
      secret: secret.base32, // for manual entry
    });
  } catch (error) {
    console.error('MFA setup error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const verifyMFA = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { token } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid MFA code',
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'MFA enabled successfully',
    });
  } catch (error) {
    console.error('MFA verify error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  setupMFA,
  verifyMFA,
};