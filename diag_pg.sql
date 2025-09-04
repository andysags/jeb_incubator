-- diag_pg.sql
-- Version corrigée pour PostgreSQL : évite la référence circulaire en ajoutant
-- les contraintes FOREIGN KEY après la création des tables.

CREATE TABLE "Role" (
  "id" SERIAL PRIMARY KEY,
  "nom" varchar NOT NULL, -- admin, startup, investisseur, visiteur
  "permissions" json
);

CREATE TABLE "Startup" (
  "id" SERIAL PRIMARY KEY,
  "nom" varchar NOT NULL,
  "slug" varchar UNIQUE NOT NULL,
  "description_courte" varchar,
  "description_longue" text,
  "secteur" varchar,
  "stade" varchar, -- idée, seed, croissance
  "date_creation" date,
  "site_web" varchar,
  "reseaux_sociaux" json,
  "logo_url" varchar,
  "contact_email" varchar NOT NULL,
  "contact_tel" varchar,
  "localisation" varchar,
  "date_incub" date,
  "nb_pers" int CHECK(nb_pers >= 0),
  "chiffre_aff" numeric,
  "cree_par" int,
  "cree_le" timestamp DEFAULT now(),
  "maj_le" timestamp DEFAULT now()
);

CREATE TABLE "Utilisateurs" (
  "id" SERIAL PRIMARY KEY,
  "nom" varchar(100) NOT NULL,
  "email" varchar UNIQUE NOT NULL,
  "password" varchar NOT NULL,
  "role_id" int REFERENCES "Role" ("id"),
  "startup_id" int,
  "avatar_url" varchar,
  "dernier_login" timestamp,
  "cree_le" timestamp DEFAULT now(),
  "maj_le" timestamp DEFAULT now()
);

-- Ajouter les clés étrangères circulaires après création des deux tables
ALTER TABLE "Utilisateurs"
  ADD CONSTRAINT utilisateurs_startup_fk FOREIGN KEY ("startup_id") REFERENCES "Startup" ("id");

ALTER TABLE "Startup"
  ADD CONSTRAINT startup_cree_par_fk FOREIGN KEY ("cree_par") REFERENCES "Utilisateurs" ("id");

CREATE TABLE "Actualite" (
  "id" SERIAL PRIMARY KEY,
  "titre" varchar NOT NULL,
  "slug" varchar UNIQUE NOT NULL,
  "contenu" text NOT NULL,
  "image_url" varchar,
  "publie_le" timestamp DEFAULT now(),
  "auteur_id" int REFERENCES "Utilisateurs" ("id")
);

CREATE TABLE "Evenement" (
  "id" SERIAL PRIMARY KEY,
  "titre" varchar NOT NULL,
  "description" text,
  "date_debut" timestamp,
  "date_fin" timestamp,
  "lieu" varchar,
  "organisateur_id" int REFERENCES "Utilisateurs" ("id"),
  "nb_inscrits" int DEFAULT 0
);

CREATE TABLE "Opportunites" (
  "id" SERIAL PRIMARY KEY,
  "titre" varchar NOT NULL,
  "description" text,
  "type" varchar, -- appel_projet, financement, partenariat…
  "date_limite" timestamp,
  "lien" varchar
);

CREATE TABLE "Message" (
  "id" SERIAL PRIMARY KEY,
  "expediteur_id" int REFERENCES "Utilisateurs" ("id"),
  "destinataire_id" int REFERENCES "Utilisateurs" ("id"),
  "sujet" varchar,
  "contenu" text,
  "lu_le" timestamp,
  "cree_le" timestamp DEFAULT now()
);

CREATE TABLE "Fichier" (
  "id" SERIAL PRIMARY KEY,
  "nom" varchar NOT NULL,
  "url" varchar NOT NULL,
  "type" varchar,
  "taille" int,
  "proprietaire_type" varchar NOT NULL, -- Startup, Projet, Utilisateur
  "proprietaire_id" int NOT NULL,
  "cree_le" timestamp DEFAULT now()
  -- Pas de FK car relation polymorphe
);

CREATE TABLE "AuditLog" (
  "id" SERIAL PRIMARY KEY,
  "utilisateur_id" int REFERENCES "Utilisateurs" ("id"),
  "type_action" varchar NOT NULL, -- create, update, delete, login…
  "cible_type" varchar NOT NULL, -- Startup, Message…
  "cible_id" int NOT NULL,
  "meta" json,
  "cree_le" timestamp DEFAULT now()
);

CREATE TABLE "ImportAPI" (
  "id" SERIAL PRIMARY KEY,
  "source" varchar NOT NULL DEFAULT 'API JEB',
  "remote_id" varchar NOT NULL,
  "local_id" int NOT NULL,
  "cible_type" varchar NOT NULL, -- Startup, Actualite, Evenement…
  "dernier_sync" timestamp DEFAULT now(),
  "payload_brut" json
);
