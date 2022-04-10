module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', '61d799cf4f9eead236d637dd36146467'),
  },
});
