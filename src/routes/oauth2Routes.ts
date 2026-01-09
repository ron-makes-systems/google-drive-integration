import {Router, Request, Response} from "express";
import {google} from "googleapis";
import {config} from "../config.js";
import {asyncWrap} from "../utils/asyncWrap.js";
import {ValidationError} from "../errors/errors.js";

type OAuth2AuthorizeRequestBody = {
  callback_uri: string;
  state: string;
};

type OAuth2AccessTokenRequestBody = {
  fields?: {
    callback_uri?: string;
  };
  code: string;
};

export const createOAuth2Routes = () => {
  const router = Router();

  // POST /oauth2/v1/authorize - Generate authorization URL
  router.post(
    "/v1/authorize",
    asyncWrap(async (req: Request<unknown, unknown, OAuth2AuthorizeRequestBody>, res: Response) => {
      const {callback_uri, state} = req.body;

      if (!callback_uri) {
        throw new ValidationError("callback_uri is required");
      }

      if (!state) {
        throw new ValidationError("state is required");
      }

      const oauth2Client = new google.auth.OAuth2(config.google.clientId, config.google.clientSecret, callback_uri);

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: config.google.scopes,
        include_granted_scopes: true,
        prompt: "consent", // Always show consent to get refresh token
        state,
      });

      res.json({redirect_uri: authUrl});
    }),
  );

  // POST /oauth2/v1/access_token - Exchange code for tokens
  router.post(
    "/v1/access_token",
    asyncWrap(async (req: Request<unknown, unknown, OAuth2AccessTokenRequestBody>, res: Response) => {
      const {code, fields} = req.body;

      if (!code) {
        throw new ValidationError("Authorization code is required");
      }

      const callbackUri = fields?.callback_uri || config.google.redirectUri;

      const oauth2Client = new google.auth.OAuth2(config.google.clientId, config.google.clientSecret, callbackUri);

      const {tokens} = await oauth2Client.getToken(code);

      if (!tokens.access_token) {
        throw new ValidationError("Failed to obtain access token");
      }

      // Calculate expiration time
      const expiresOn = tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : new Date(Date.now() + 3600 * 1000).toISOString();

      res.json({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expire_on: expiresOn,
      });
    }),
  );

  return router;
};
