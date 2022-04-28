const {
  API: {
    PATHS: { AUTHORIZE },
  },
  APP: {
    PATHS: { FRAUD },
  },
} = require("../../lib/config");

module.exports = {
  addAuthParamsToSession: async (req, res, next) => {
    req.session.authParams = { client_id: req.query.client_id };

    next();
  },

  addJWTToRequest: (req, res, next) => {
    req.jwt = req.query?.request;
    next();
  },

  initSessionWithJWT: async (req, res, next) => {
    const requestJWT = req.jwt;
    try {
      if (requestJWT) {
        const apiResponse = await req.axios.post(AUTHORIZE, {
          request: req.jwt,
          client_id: req.session.authParams.client_id,
        });
        req.session.tokenId = apiResponse?.data["session_id"];
      }
      return next();
    } catch (error) {
      return next(error);
    }
  },

  redirectToCallback: async (req, res, next) => {
    try {
      const authCode = req.session["hmpo-wizard-fraud"].authorization_code;
      const url = req.session["hmpo-wizard-fraud"].redirect_url;
      const state = req.session["hmpo-wizard-fraud"].state;
      const redirectUrl = new URL(url);

      if (!authCode) {
        const error = req.session["hmpo-wizard-fraud"].error;
        const errorCode = error?.code;
        const errorDescription = error?.description ?? error?.message;

        redirectUrl.searchParams.append("error", errorCode);
        redirectUrl.searchParams.append("error_description", errorDescription);
      } else {
        redirectUrl.searchParams.append(
          "client_id",
          req.session.authParams.client_id
        );
        redirectUrl.searchParams.append("state", state);
        redirectUrl.searchParams.append("code", authCode);
      }
      res.redirect(redirectUrl.toString());
    } catch (e) {
      next(e);
    }
  },

  redirectToFraud: async (req, res) => {
    res.redirect(FRAUD);
  },
};
