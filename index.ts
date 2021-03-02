import "dotenv/config";
import { IgApiClient } from "instagram-private-api";
import { writeFile, readFile, exists } from "fs";
import { promisify } from "util";

const writeFileAsync = promisify(writeFile);
const readFileAsync = promisify(readFile);
const existsAsync = promisify(exists);

export default class Instagram {
  public client: IgApiClient;

  private readState = async (ig: IgApiClient): Promise<boolean> => {
    if (!(await existsAsync("state.json"))) return false;
    // normal reading of state for the instagram-api
    const { cookies, state, fbnsAuth } = JSON.parse(
      await readFileAsync("state.json", { encoding: "utf8" }),
    );
    ig.state.deviceString = state.deviceString;
    ig.state.deviceId = state.deviceId;
    ig.state.uuid = state.uuid;
    ig.state.phoneId = state.phoneId;
    ig.state.adid = state.adid;
    ig.state.build = state.build;
    await ig.state.deserializeCookieJar(cookies);

    try {
      process.nextTick(async () => await ig.simulate.postLoginFlow());
    } catch (e) {
      console.log(e);
    }

    return true;
  };

  private saveState = async (ig: IgApiClient): Promise<void> => {
    const cookies = await ig.state.serializeCookieJar();
    const state = {
      deviceString: ig.state.deviceString,
      deviceId: ig.state.deviceId,
      uuid: ig.state.uuid,
      phoneId: ig.state.phoneId,
      adid: ig.state.adid,
      build: ig.state.build,
    };

    return writeFileAsync(
      "state.json",
      JSON.stringify({
        cookies: JSON.stringify(cookies),
        state,
      }),
      { encoding: "utf8" },
    );
  };

  private authenticate = async (ig: IgApiClient): Promise<void> => {
    ig.state.generateDevice(process.env.INSTAGRAM_USERNAME);

    ig.request.end$.subscribe(() => this.saveState(ig));

    await ig.account.login(
      process.env.INSTAGRAM_USERNAME,
      process.env.INSTAGRAM_PASSWORD,
    );

    try {
      process.nextTick(async () => await ig.simulate.postLoginFlow());
    } catch (e) {
      console.log(e);
    }
  };

  public login = async (): Promise<void> => {
    this.client = new IgApiClient();

    const saved_state = await this.readState(this.client);
    console.log(saved_state);

    if (!saved_state) {
      await this.authenticate(this.client);
    }
  };
}

(async () => {
  const ig = new Instagram();
  await ig.login();

  const close_friend_username = "nickmandylas";
  const friend_id = await ig.client.user.getIdByUsername(close_friend_username);

  await ig.client.friendship
    .setBesties({ add: [friend_id] })
    .then((res) => console.log(res));
})();
