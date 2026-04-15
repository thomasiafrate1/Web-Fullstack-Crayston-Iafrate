# 📧 Campaign Email System - Testing Guide

## Prérequis

1. **Variables d'environnement** :
   - `NEXT_PUBLIC_SUPABASE_URL` - URL Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` - Clé service Supabase
   - `RESEND_API_KEY` - Clé API Resend (pour l'envoi d'emails)

2. **Base de données** : Migration 20260414130000_review_flow_v2.sql appliquée

## Quick Start - Manuel

### 1. Créer des contacts de test

Via la page `/contacts`, cliquez sur "Ajouter un contact" et remplissez au moins 3 emails :
- test1@gmail.com (Jean Dupont)
- test2@gmail.com (Marie Martin)
- test3@gmail.com (Pierre Bernard)

### 2. Créer une campagne

Via la page `/campagnes` :
1. Cliquez "Nouvelle Campagne"
2. Remplissez :
   - **Nom** : "Test Campaign 🚀"
   - **Sujet** : "Welcome to our campaign!"
   - **Template HTML** :
   ```html
   <html>
     <body style="font-family: Arial; padding: 20px;">
       <h1>Hello {{name}}</h1>
       <p>This is a test campaign email.</p>
       <p style="color: #999; font-size: 12px; margin-top: 20px;">
         Sent on {{date}}
       </p>
     </body>
   </html>
   ```
   - **Destinataires** : Collez les emails séparés par des virgules ou des sauts de ligne

3. Cliquez "Créer"

### 3. Envoyer la campagne

1. Allez à `/campagnes`
2. Trouvez la campagne créée avec le statut "draft"
3. Cliquez "Envoyer"
4. Le système :
   - Change le statut à "sending"
   - Invoque la fonction edge `send-campaign-emails`
   - Envoie les emails via Resend
   - Met à jour le statut à "sent" ou "failed"

## Test Automatisé - Script Node

```bash
# Configurer les env vars
$env:NEXT_PUBLIC_SUPABASE_URL = "YOUR_URL"
$env:SUPABASE_SERVICE_ROLE_KEY = "YOUR_KEY"

# Lancer le test
node test-campaign.mjs
```

Le script va :
1. ✅ Créer une organisation de test
2. ✅ Créer un utilisateur de test
3. ✅ Créer 3 contacts de test
4. ✅ Créer une campagne de test
5. ✅ Ajouter les recipients
6. ✅ Invoquer la fonction d'envoi
7. ✅ Vérifier les résultats

## Architecture du Système

```
┌─────────────────┐
│  Frontend       │
│  /campagnes     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  src/actions/campaigns.ts   │
│  sendCampaignAction()       │
└────────┬────────────────────┘
         │ invoke()
         ▼
┌───────────────────────────────────────────┐
│  Supabase Edge Function                   │
│  send-campaign-emails/index.ts            │
│  1. Fetch campaign details                │
│  2. Fetch recipients                      │
│  3. Batch send via Resend API             │
│  4. Update recipient statuses             │
│  5. Return results (ok/error)             │
└────────┬────────────────────────────────┬─┘
         │                                │
    Resend API                       Supabase DB
    (email delivery)         (recipient status updates)
```

## Debugging

### Vérifier les logs

**Frontend** :
```bash
npm run dev  # Check browser console
```

**Edge Function** :
```bash
supabase functions serve send-campaign-emails --env-file .env.local
```

**Supabase Logs** :
```bash
supabase functions list  # List all functions
supabase functions logs send-campaign-emails
```

### Vérifier les données en BD

```sql
-- Voir les campagnes
SELECT id, name, status, created_at FROM campaigns LIMIT 5;

-- Voir les recipients d'une campagne
SELECT email, status, sent_at FROM campaign_recipients 
WHERE campaign_id = 'YOUR_CAMPAIGN_ID' 
LIMIT 10;

-- Audit logs
SELECT action, entity_id, metadata, created_at 
FROM audit_logs 
ORDER BY created_at DESC LIMIT 20;
```

## Possibles Problèmes & Solutions

### ❌ "Campaign not found"
- Vérifiez que `org_id` est correct
- Vérifiez que l'utilisateur appartient à l'org

### ❌ "No recipients found"
- Créez des contacts et ajoutez les emails en créant la campagne
- Vérifiez que la campagne a au moins 1 recipient

### ❌ "Missing RESEND_API_KEY"
- Configurez la variable d'environnement dans Supabase
- Format : `Bearer YOUR_KEY` n'est pas nécessaire

### ❌ HTTP 200 mais emails non envoyés
- Vérifiez `successCount` et `failureCount` dans la réponse
- 200 ne signifie pas que TOUS les emails ont été envoyés
- Statut partiel : 207 (Multi-Status)
- Tous les emails échoués : 500

### ❌ "Request timeout"
- La fonction a un timeout de 15s par email
- Vérifiez la connection Resend API
- Vérifiez les logs Supabase

## Statuts de Campagne

```
draft     → Campagne créée, non envoyée
sending   → En cours d'envoi (temporaire)
sent      → Tous les emails envoyés ✅
failed    → Des erreurs lors de l'envoi ❌
scheduled → Programmé pour plus tard (TODO)
```

## Statuts de Recipient

```
draft      → Créé, pas encore envoyé
queued     → En attente d'envoi (TODO)
sent       → Email envoyé via Resend ✅
failed     → Erreur d'envoi ❌
opened     → Recipient a ouvert (TODO webhook)
clicked    → Recipient a cliqué (TODO webhook)
```

## Prochaines Améliorations

- [ ] Retry logic pour les emails échoués
- [ ] Scheduling (envoyer à une heure spécifique)
- [ ] Webhooks Resend pour trackage (open, click)
- [ ] Templating avancé (variables, conditions)
- [ ] A/B testing
- [ ] Rate limiting (max X emails/min)
- [ ] Export des résultats en CSV
