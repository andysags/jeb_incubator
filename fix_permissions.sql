-- Script de correction des permissions après renommage des tables
-- À exécuter connecté en superuser dans psql

-- 1. Lister les séquences actuelles pour identifier les vrais noms
\ds

-- 2. Donner ownership complet (plus simple que GRANT)
ALTER TABLE users OWNER TO merchex_user;
ALTER TABLE events OWNER TO merchex_user;
ALTER TABLE startups OWNER TO merchex_user;
ALTER TABLE messages OWNER TO merchex_user;
ALTER TABLE news OWNER TO merchex_user;
ALTER TABLE opportunities OWNER TO merchex_user;
ALTER TABLE files OWNER TO merchex_user;
ALTER TABLE audit_logs OWNER TO merchex_user;
ALTER TABLE import_api OWNER TO merchex_user;

-- 3. Séquences (adapter les vrais noms après \ds)
-- Probablement encore les anciens noms après rename table
ALTER SEQUENCE "Utilisateurs_id_seq" OWNER TO merchex_user;
ALTER SEQUENCE "Evenement_id_seq" OWNER TO merchex_user;
ALTER SEQUENCE "Startup_id_seq" OWNER TO merchex_user;
ALTER SEQUENCE "Message_id_seq" OWNER TO merchex_user;
ALTER SEQUENCE "Actualite_id_seq" OWNER TO merchex_user;
ALTER SEQUENCE "Opportunites_id_seq" OWNER TO merchex_user;
ALTER SEQUENCE "Fichier_id_seq" OWNER TO merchex_user;
ALTER SEQUENCE "AuditLog_id_seq" OWNER TO merchex_user;
ALTER SEQUENCE "ImportAPI_id_seq" OWNER TO merchex_user;

-- 4. Optionnel: renommer séquences pour cohérence
ALTER SEQUENCE "Utilisateurs_id_seq" RENAME TO users_id_seq;
ALTER SEQUENCE "Evenement_id_seq" RENAME TO events_id_seq;
ALTER SEQUENCE "Startup_id_seq" RENAME TO startups_id_seq;
ALTER SEQUENCE "Message_id_seq" RENAME TO messages_id_seq;
ALTER SEQUENCE "Actualite_id_seq" RENAME TO news_id_seq;
ALTER SEQUENCE "Opportunites_id_seq" RENAME TO opportunities_id_seq;
ALTER SEQUENCE "Fichier_id_seq" RENAME TO files_id_seq;
ALTER SEQUENCE "AuditLog_id_seq" RENAME TO audit_logs_id_seq;
ALTER SEQUENCE "ImportAPI_id_seq" RENAME TO import_api_id_seq;

-- 5. Réassocier séquences aux tables renommées
ALTER SEQUENCE users_id_seq OWNED BY users.id;
ALTER SEQUENCE events_id_seq OWNED BY events.id;
ALTER SEQUENCE startups_id_seq OWNED BY startups.id;
ALTER SEQUENCE messages_id_seq OWNED BY messages.id;
ALTER SEQUENCE news_id_seq OWNED BY news.id;
ALTER SEQUENCE opportunities_id_seq OWNED BY opportunities.id;
ALTER SEQUENCE files_id_seq OWNED BY files.id;
ALTER SEQUENCE audit_logs_id_seq OWNED BY audit_logs.id;
ALTER SEQUENCE import_api_id_seq OWNED BY import_api.id;

-- 6. Droits globaux pour nouveaux objets
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO merchex_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO merchex_user;

-- 7. Vérification
\dt
\ds
