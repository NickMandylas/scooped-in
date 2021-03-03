import "dotenv/config";
import {
  AccountRepositoryLoginResponseLogged_in_user,
  IgApiClient,
  IgLoginTwoFactorRequiredError,
} from "instagram-private-api";
import { PrismaClient, Profile } from "@prisma/client";
import axios from "axios";
import Bluebird from "bluebird";
import inquirer = require("inquirer");

const prisma = new PrismaClient();

// (async () => {
//   const ig = new Instagram();
//   await ig.login("disposable.nick");

//   const close_friend_username = "nickmandylas";
//   const friend_id = await ig.client.user.getIdByUsername(close_friend_username);

//   await ig.client.friendship
//     .setBesties({ add: [friend_id] })
//     .then((res) => console.log(res));

//   await prisma.$disconnect();
// })();

class Instagram {
  public uuid: string | null;
  public username: string;
  public client: IgApiClient;

  constructor(username: string) {
    this.client = new IgApiClient();
    this.username = username;
    this.uuid = null;
  }

  public getAccountPk = async (accountName: string): Promise<string | null> => {
    try {
      const res = await axios
        .get(`https://www.instagram.com/${accountName}/?__a=1`)
        .then((response) => response.data)
        .then((data) => {
          return data.graphql.user.id;
        });
      return res;
    } catch (err) {
      console.log({
        code: err.response.status,
        reason: err.response.statusText,
        username: accountName,
      });
      return null;
    }
  };

  private getProfile = async (pk: string): Promise<Profile | null> => {
    return await prisma.profile.findUnique({
      where: { publicId: pk },
    });
  };
}

const getAccountPk = async (accountName: string): Promise<string | null> => {
  try {
    const res = await axios
      .get(`https://www.instagram.com/${accountName}/?__a=1`)
      .then((response) => response.data)
      .then((data) => {
        return data.graphql.user.id;
      });
    return res;
  } catch (err) {
    console.log({
      code: err.response.status,
      reason: err.response.statusText,
      username: accountName,
    });
    return null;
  }
};

const getProfile = async (pk: string): Promise<Profile | null> => {
  return await prisma.profile.findUnique({
    where: { publicId: pk },
  });
};

const authenticate = async (
  ig: IgApiClient,
): Promise<void | AccountRepositoryLoginResponseLogged_in_user> => {
  ig.state.generateDevice(process.env.INSTAGRAM_USERNAME!);

  ig.request.end$.subscribe(() => saveState(ig));

  return Bluebird.try(() =>
    ig.account.login(
      process.env.INSTAGRAM_USERNAME!,
      process.env.INSTAGRAM_PASSWORD!,
    ),
  )
    .catch(IgLoginTwoFactorRequiredError, async (err) => {
      const {
        username,
        totp_two_factor_on,
        two_factor_identifier,
      } = err.response.body.two_factor_info;
      const verificationMethod = totp_two_factor_on ? "0" : "1"; // default to 1 for SMS
      const { code } = await inquirer.prompt([
        {
          type: "input",
          name: "code",
          message: `Enter code received via ${
            verificationMethod === "1" ? "SMS" : "TOTP"
          }`,
        },
      ]);
      // Finishing the login process
      return ig.account.twoFactorLogin({
        username,
        verificationCode: code,
        twoFactorIdentifier: two_factor_identifier,
        verificationMethod,
        trustThisDevice: "1",
      });
    })
    .catch((e) =>
      console.error(
        "An error occurred while processing two factor auth",
        e,
        e.stack,
      ),
    );
};

const saveState = async (ig: IgApiClient): Promise<void> => {
  const cookies = await ig.state.serializeCookieJar();
  const device = {
    deviceString: ig.state.deviceString,
    deviceId: ig.state.deviceId,
    uuid: ig.state.uuid,
    phoneId: ig.state.phoneId,
    adid: ig.state.adid,
    build: ig.state.build,
  };

  const state = JSON.stringify({
    cookies: JSON.stringify(cookies),
    device,
  });
};

(async () => {
  const pk = await getAccountPk("disposable.nick");
  if (pk) {
    const profile = await getProfile(pk);

    if (!profile) {
      const client = new IgApiClient();
      const user = await authenticate(client);
      console.log(user);
    }
  }
})();
