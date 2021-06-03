import { Migration } from '@mikro-orm/migrations';

export class Migration20210603152316 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "watcher" add column "avatar" text null;');
  }

}
