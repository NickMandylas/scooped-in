import axios from "axios";
import Bluebird from "bluebird";
import { Creator, Profile } from "entities";
import {
  IgApiClient,
  IgLoginTwoFactorRequiredError,
} from "instagram-private-api";
import redis from "utils/redis";
import { app } from ".";

type SessionType = {
  cookies: string;
  state: {
    deviceString: string;
    deviceId: string;
    uuid: string;
    phoneId: string;
    adid: string;
    build: string;
  };
};

export class Instagram {
  public uuid: string | null;
  public username: string;
  public client: IgApiClient;

  constructor(username: string) {
    this.client = new IgApiClient();
    this.username = username;
    this.uuid = null;
  }

  public getAccountPk = async (): Promise<string | null> => {
    try {
      const res = await axios
        .get(`https://www.instagram.com/${this.username}/?__a=1`)
        .then((response) => response.data)
        .then((data) => {
          this.uuid = data.graphql.user.id;
          return data.graphql.user.id;
        });
      return res;
    } catch (err) {
      return null;
    }
  };

  public getProfileByPk = async (pk: string): Promise<Profile | null> => {
    const orm = app.orm;
    return await orm.em.findOne(Profile, { uuid: pk });
  };

  public getProfileByCreator = async (
    creatorId: string,
  ): Promise<Profile | null> => {
    const orm = app.orm;
    return await orm.em.findOne(Profile, { creatorId });
  };

  private getState = async (): Promise<SessionType> => {
    const cookies = await this.client.state.serializeCookieJar();
    const state = {
      deviceString: this.client.state.deviceString,
      deviceId: this.client.state.deviceId,
      uuid: this.client.state.uuid,
      phoneId: this.client.state.phoneId,
      adid: this.client.state.adid,
      build: this.client.state.build,
    };

    return {
      cookies: JSON.stringify(cookies),
      state,
    };
  };

  public saveSession = async () => {
    const orm = app.orm;
    const profile = await orm.em.findOne(Profile, { uuid: this.uuid });

    if (profile) {
      const session = await this.getState();
      profile.session = session;
      await orm.em.persistAndFlush(profile);
    }
  };

  // private getSession = async (): Promise<Profile | null> => {
  //   const orm = app.orm;
  //   const profile = await orm.em.findOne(Profile, { uuid: this.uuid });
  //   return profile;
  // };

  public linkAccount = async (creatorId: string): Promise<boolean> => {
    const orm = app.orm;
    const creator = await orm.em.findOne(Creator, { id: creatorId });

    if (creator) {
      const session = await this.getState();

      const profile = orm.em.create(Profile, {
        creator,
        uuid: this.uuid,
        session,
      });

      await orm.em.persistAndFlush(profile);

      return true;
    }

    return false;
  };

  // TODO - Test if this works, changed 2FA authentication flow.
  public twoFactorVerify = async (token: string) => {
    const saved = await redis().get(`instagram-two-factor:${this.uuid}`);

    if (saved) {
      const twoFactor = JSON.parse(saved);
      const state = this.client.state;

      state.deviceString = twoFactor.state.deviceString;
      state.deviceId = twoFactor.state.deviceId;
      state.uuid = twoFactor.state.uuid;
      state.phoneId = twoFactor.state.phoneId;
      state.adid = twoFactor.state.adid;
      state.build = twoFactor.state.build;

      return this.client.account
        .twoFactorLogin({
          username: this.username,
          verificationCode: token,
          twoFactorIdentifier: twoFactor.two_factor_identifier,
          trustThisDevice: "1",
        })
        .then(async () => {
          return { status: "authenticated" };
        });
    }

    return { status: "twoFactorError" };
  };

  public authenticate = async (password: string) => {
    this.client.state.generateDevice(this.username);

    return Bluebird.try(() =>
      this.client.account.login(this.username, password),
    )
      .then(async () => {
        return { status: "authenticated" };
      })
      .catch(IgLoginTwoFactorRequiredError, (err) => {
        const twoFactor = JSON.stringify({
          twoFactorIdentifier:
            err.response.body.two_factor_info.two_factor_identifier,
          state: {
            deviceString: this.client.state.deviceString,
            deviceId: this.client.state.deviceId,
            uuid: this.client.state.uuid,
            phoneId: this.client.state.phoneId,
            adid: this.client.state.adid,
            build: this.client.state.build,
          },
        });

        redis().set(
          `instagram-two-factor:${this.uuid}`,
          twoFactor,
          "ex",
          60 * 60 * 24,
        );

        return { status: "twoFactorSent" };
      });
  };
}
