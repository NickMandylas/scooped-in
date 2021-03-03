export default class test {
  public client: IgApiClient;

  constructor() {
    this.client = new IgApiClient();
  }

  private readState = async (
    ig: IgApiClient,
    publicId: string,
  ): Promise<boolean> => {
    const profile = await prisma.profile.findUnique({
      where: { publicId },
    });

    if (!profile) return false;

    const { cookies, device } = JSON.parse(profile.data as string);

    ig.state.deviceString = device.deviceString;
    ig.state.deviceId = device.deviceId;
    ig.state.uuid = device.uuid;
    ig.state.phoneId = device.phoneId;
    ig.state.adid = device.adid;
    ig.state.build = device.build;
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
    ig.state.generateDevice(process.env.INSTAGRAM_USERNAME!);

    ig.request.end$.subscribe(() => this.saveState(ig));

    await ig.account.login(
      process.env.INSTAGRAM_USERNAME!,
      process.env.INSTAGRAM_PASSWORD!,
    );

    try {
      process.nextTick(async () => await ig.simulate.postLoginFlow());
    } catch (e) {
      console.log(e);
    }
  };

  public login = async (id: string): Promise<void> => {
    const saved_state = await this.readState(this.client, id);
    console.log(saved_state);

    if (!saved_state) {
      await this.authenticate(this.client);
    }
  };

  public getProfilePk = async (accountName: string): Promise<string> => {
    await axios
      .get(`https://www.instagram.com/${accountName}/?__a=1`)
      .then((response) => response.data);

    return "1";
  };
}
