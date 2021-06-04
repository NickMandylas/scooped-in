import { Migration } from '@mikro-orm/migrations';

export class Migration20210304123618 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "watcher" ("id" uuid not null, "name" text not null, "email" text not null, "password" text not null, "confirmed" bool not null, "banned" bool not null, "instagram_uuid" text null, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null);');
    this.addSql('alter table "watcher" add constraint "watcher_pkey" primary key ("id");');
    this.addSql('alter table "watcher" add constraint "watcher_email_unique" unique ("email");');
    this.addSql('alter table "watcher" add constraint "watcher_instagram_uuid_unique" unique ("instagram_uuid");');

    this.addSql('create table "creator" ("id" uuid not null, "first_name" text not null, "last_name" text not null, "email" text not null, "password" text not null, "avatar" text null, "confirmed" bool not null, "status" text not null, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "profile_creator_id" uuid null);');
    this.addSql('alter table "creator" add constraint "creator_pkey" primary key ("id");');
    this.addSql('alter table "creator" add constraint "creator_email_unique" unique ("email");');
    this.addSql('alter table "creator" add constraint "creator_profile_creator_id_unique" unique ("profile_creator_id");');

    this.addSql('create table "payment" ("id" uuid not null, "creator_id" uuid not null, "watcher_id" uuid not null, "charge_id" text not null, "amount" int4 not null, "card" jsonb not null, "status" text not null, "created_at" timestamptz(0) not null);');
    this.addSql('alter table "payment" add constraint "payment_pkey" primary key ("id");');

    this.addSql('create table "profile" ("creator_id" uuid not null, "uuid" text not null, "session" jsonb null, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null);');
    this.addSql('alter table "profile" add constraint "profile_creator_id_unique" unique ("creator_id");');
    this.addSql('alter table "profile" add constraint "profile_uuid_unique" unique ("uuid");');

    this.addSql('create table "subscription" ("id" uuid not null, "creator_id" uuid not null, "watcher_id" uuid not null, "expiration" jsonb not null, "status" text not null, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null);');
    this.addSql('alter table "subscription" add constraint "subscription_pkey" primary key ("id");');

    this.addSql('alter table "creator" add constraint "creator_profile_creator_id_foreign" foreign key ("profile_creator_id") references "profile" ("creator_id") on update cascade on delete set null;');

    this.addSql('alter table "payment" add constraint "payment_creator_id_foreign" foreign key ("creator_id") references "creator" ("id") on update cascade;');
    this.addSql('alter table "payment" add constraint "payment_watcher_id_foreign" foreign key ("watcher_id") references "watcher" ("id") on update cascade;');

    this.addSql('alter table "profile" add constraint "profile_creator_id_foreign" foreign key ("creator_id") references "creator" ("id") on update cascade;');

    this.addSql('alter table "subscription" add constraint "subscription_creator_id_foreign" foreign key ("creator_id") references "creator" ("id") on update cascade;');
    this.addSql('alter table "subscription" add constraint "subscription_watcher_id_foreign" foreign key ("watcher_id") references "watcher" ("id") on update cascade;');
  }

}
