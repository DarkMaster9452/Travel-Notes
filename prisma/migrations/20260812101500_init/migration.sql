-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'UNPAID', 'PAUSED');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'EXPLORER');

-- CreateEnum
CREATE TYPE "DifficultyPreference" AS ENUM ('EASY', 'MODERATE', 'HARD', 'SURPRISE');

-- CreateEnum
CREATE TYPE "TimeAvailable" AS ENUM ('SHORT', 'HALF', 'LONG', 'FULL', 'SURPRISE');

-- CreateEnum
CREATE TYPE "Transport" AS ENUM ('CAR', 'PUBLIC_TRANSPORT', 'BIKE', 'WALKING');

-- CreateEnum
CREATE TYPE "QuestStyle" AS ENUM ('RELAXED', 'ADVENTUROUS', 'CHALLENGING', 'RANDOM');

-- CreateEnum
CREATE TYPE "Ternary" AS ENUM ('YES', 'NO', 'SURPRISE');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MODERATE', 'HARD', 'EXPERT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "password_hash" TEXT NOT NULL,
    "free_quests_used" INTEGER NOT NULL DEFAULT 0,
    "onboarded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "stripe_price_id" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "home_location" TEXT NOT NULL,
    "home_latitude" DOUBLE PRECISION,
    "home_longitude" DOUBLE PRECISION,
    "max_distance" INTEGER NOT NULL DEFAULT 50,
    "preferred_distance" INTEGER NOT NULL DEFAULT 10,
    "difficulty" "DifficultyPreference" NOT NULL DEFAULT 'SURPRISE',
    "preferred_terrain" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferred_activity" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferred_environment" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "time_available" "TimeAvailable" NOT NULL DEFAULT 'SURPRISE',
    "transport" "Transport" NOT NULL DEFAULT 'CAR',
    "quest_style" "QuestStyle" NOT NULL DEFAULT 'ADVENTUROUS',
    "sunset_preference" "Ternary" NOT NULL DEFAULT 'SURPRISE',
    "water_preference" "Ternary" NOT NULL DEFAULT 'SURPRISE',
    "elevation_preference" "Ternary" NOT NULL DEFAULT 'SURPRISE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quests" (
    "id" TEXT NOT NULL,
    "number" INTEGER,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "bonus" TEXT,
    "safety_notes" TEXT,
    "location" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Slovakia',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER NOT NULL,
    "travel_time" INTEGER,
    "difficulty" "Difficulty" NOT NULL,
    "elevation_gain" INTEGER NOT NULL,
    "terrain" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mood" TEXT,
    "cover_image" TEXT NOT NULL,
    "route_data" JSONB,
    "signature" TEXT NOT NULL,
    "is_showcase" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quest_generations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "quest_id" TEXT NOT NULL,
    "generation_number" INTEGER NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generation_parameters" JSONB NOT NULL,

    CONSTRAINT "quest_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quest_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "quest_id" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "saved" BOOLEAN NOT NULL DEFAULT false,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quest_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_quests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "quest_id" TEXT NOT NULL,
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "window_start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_customer_id_key" ON "subscriptions"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "user_preferences"("user_id");

-- CreateIndex
CREATE INDEX "quests_is_showcase_idx" ON "quests"("is_showcase");

-- CreateIndex
CREATE INDEX "quests_signature_idx" ON "quests"("signature");

-- CreateIndex
CREATE INDEX "quest_generations_user_id_generated_at_idx" ON "quest_generations"("user_id", "generated_at");

-- CreateIndex
CREATE UNIQUE INDEX "quest_generations_user_id_generation_number_key" ON "quest_generations"("user_id", "generation_number");

-- CreateIndex
CREATE INDEX "quest_history_user_id_generated_at_idx" ON "quest_history"("user_id", "generated_at");

-- CreateIndex
CREATE UNIQUE INDEX "quest_history_user_id_quest_id_key" ON "quest_history"("user_id", "quest_id");

-- CreateIndex
CREATE INDEX "saved_quests_user_id_saved_at_idx" ON "saved_quests"("user_id", "saved_at");

-- CreateIndex
CREATE UNIQUE INDEX "saved_quests_user_id_quest_id_key" ON "saved_quests"("user_id", "quest_id");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limits_key_key" ON "rate_limits"("key");

-- CreateIndex
CREATE INDEX "rate_limits_window_start_idx" ON "rate_limits"("window_start");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_generations" ADD CONSTRAINT "quest_generations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_generations" ADD CONSTRAINT "quest_generations_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "quests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_history" ADD CONSTRAINT "quest_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_history" ADD CONSTRAINT "quest_history_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "quests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_quests" ADD CONSTRAINT "saved_quests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_quests" ADD CONSTRAINT "saved_quests_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "quests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

