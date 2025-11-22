// src/services/permitSetupService.js
// Service d'initialisation et synchronisation de la configuration Permit.io

const permit = require('../config/permit.config');
const setupConfig = require('../config/permit-setup.json');
const axios = require('axios');

class PermitSetupService {

  constructor() {
    this.apiKey = process.env.PERMIT_API_KEY;
    this.apiUrl = 'https://api.permit.io/v2';
    this.projectId = null;
    this.envId = null;
  }

  // Headers pour l'API REST Permit.io
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  // Récupérer le projet et environnement actifs
  async getProjectAndEnv() {
    try {
      const response = await axios.get(`${this.apiUrl}/api-key/scope`, {
        headers: this.getHeaders()
      });
      this.projectId = response.data.project_id;
      this.envId = response.data.environment_id;
      console.log(`   ✓ Projet: ${this.projectId}, Env: ${this.envId}`);
      return true;
    } catch (error) {
      console.error('   ✗ Erreur récupération projet/env:', error.message);
      return false;
    }
  }

  // Initialiser toute la configuration Permit.io au démarrage
  async initializePermitConfig() {
    console.log('🔧 Initialisation de la configuration Permit.io...');

    try {
      // 0. Récupérer le projet et environnement
      await this.getProjectAndEnv();

      // 1. Créer les ressources et leurs actions
      await this.setupResources();

      // 2. Créer les rôles avec leurs permissions
      await this.setupRoles();

      // 3. Créer le tenant par défaut
      await this.setupTenant();

      // 4. Configurer les attributs utilisateur pour ABAC
      await this.setupUserAttributes();

      // 5. Créer les Condition Sets ABAC
      await this.setupConditionSets();

      console.log('✅ Configuration Permit.io initialisée avec succès !');
      return true;
    } catch (error) {
      console.error('❌ Erreur initialisation Permit.io:', error.message);
      return false;
    }
  }

  // Créer ou mettre à jour les ressources
  async setupResources() {
    console.log('📦 Configuration des ressources...');

    for (const resource of setupConfig.resources) {
      try {
        // Vérifier si la ressource existe
        try {
          await permit.api.resources.get(resource.key);
          console.log(`   ✓ Ressource "${resource.key}" existe déjà`);
        } catch (e) {
          // La ressource n'existe pas, la créer
          await permit.api.resources.create({
            key: resource.key,
            name: resource.name,
            description: resource.description,
            actions: resource.actions
          });
          console.log(`   ✓ Ressource "${resource.key}" créée`);
        }

        // Mettre à jour les actions si nécessaire
        for (const [actionKey, actionData] of Object.entries(resource.actions)) {
          try {
            await permit.api.resourceActions.get(resource.key, actionKey);
          } catch (e) {
            await permit.api.resourceActions.create(resource.key, {
              key: actionKey,
              name: actionData.name,
              description: actionData.description
            });
            console.log(`   ✓ Action "${actionKey}" ajoutée à "${resource.key}"`);
          }
        }
      } catch (error) {
        console.error(`   ✗ Erreur ressource "${resource.key}":`, error.message);
      }
    }
  }

  // Créer ou mettre à jour les rôles
  async setupRoles() {
    console.log('👥 Configuration des rôles...');

    for (const role of setupConfig.roles) {
      try {
        // Vérifier si le rôle existe
        try {
          await permit.api.roles.get(role.key);
          console.log(`   ✓ Rôle "${role.key}" existe déjà`);
        } catch (e) {
          // Le rôle n'existe pas, le créer
          await permit.api.roles.create({
            key: role.key,
            name: role.name,
            description: role.description,
            permissions: role.permissions
          });
          console.log(`   ✓ Rôle "${role.key}" créé avec permissions: ${role.permissions.join(', ')}`);
        }

        // Mettre à jour les permissions du rôle
        await this.updateRolePermissions(role);

      } catch (error) {
        console.error(`   ✗ Erreur rôle "${role.key}":`, error.message);
      }
    }
  }

  // Mettre à jour les permissions d'un rôle
  async updateRolePermissions(role) {
    try {
      // Assigner les permissions au rôle
      for (const permission of role.permissions) {
        const [resourceKey, actionKey] = permission.split(':');
        try {
          await permit.api.roles.assignPermissions(role.key, [permission]);
        } catch (e) {
          // Permission peut-être déjà assignée
        }
      }
    } catch (error) {
      console.error(`   ✗ Erreur permissions "${role.key}":`, error.message);
    }
  }

  // Créer le tenant par défaut
  async setupTenant() {
    console.log('🏢 Configuration du tenant...');

    const tenantKey = setupConfig.default_tenant;

    try {
      try {
        await permit.api.tenants.get(tenantKey);
        console.log(`   ✓ Tenant "${tenantKey}" existe déjà`);
      } catch (e) {
        await permit.api.tenants.create({
          key: tenantKey,
          name: 'Default Tenant',
          description: 'Tenant par défaut de l\'application'
        });
        console.log(`   ✓ Tenant "${tenantKey}" créé`);
      }
    } catch (error) {
      console.error(`   ✗ Erreur tenant:`, error.message);
    }
  }

  // Configurer les attributs utilisateur pour ABAC
  async setupUserAttributes() {
    console.log('🏷️  Configuration des attributs utilisateur...');

    if (!this.projectId || !this.envId) {
      console.log('   ✗ Project/Env non disponibles, skip attributs');
      return;
    }

    const userAttributes = setupConfig.user_attributes || {};

    for (const [attrKey, attrConfig] of Object.entries(userAttributes)) {
      try {
        // Créer l'attribut utilisateur via API REST
        await axios.post(
          `${this.apiUrl}/schema/${this.projectId}/${this.envId}/users/attributes`,
          {
            key: attrKey,
            type: attrConfig.type,
            description: attrConfig.description
          },
          { headers: this.getHeaders() }
        );
        console.log(`   ✓ Attribut utilisateur "${attrKey}" créé`);
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`   ✓ Attribut utilisateur "${attrKey}" existe déjà`);
        } else {
          console.error(`   ✗ Erreur attribut "${attrKey}":`, error.response?.data?.message || error.message);
        }
      }
    }
  }

  // Créer les Condition Sets ABAC (User Sets)
  async setupConditionSets() {
    console.log('⚙️  Configuration des Condition Sets ABAC...');

    if (!this.projectId || !this.envId) {
      console.log('   ✗ Project/Env non disponibles, skip condition sets');
      return;
    }

    const conditionSets = setupConfig.condition_sets || [];

    for (const condSet of conditionSets) {
      try {
        // Format Permit.io pour les Condition Sets - conditions doit être un objet
        const payload = {
          key: condSet.key,
          name: condSet.name,
          type: 'userset',
          conditions: condSet.conditions
        };

        await axios.post(
          `${this.apiUrl}/schema/${this.projectId}/${this.envId}/condition_sets`,
          payload,
          { headers: this.getHeaders() }
        );
        console.log(`   ✓ Condition Set "${condSet.key}" créé`);
      } catch (error) {
        if (error.response?.status === 409 || error.response?.data?.error_code === 'DUPLICATE_ENTITY') {
          console.log(`   ✓ Condition Set "${condSet.key}" existe déjà`);
        } else {
          // Log détaillé pour debug
          console.error(`   ✗ Erreur Condition Set "${condSet.key}":`,
            JSON.stringify(error.response?.data, null, 2) || error.message);
        }
      }
    }
  }

  // Afficher la configuration actuelle (pour debug)
  getConfig() {
    return setupConfig;
  }

  // Vérifier si la configuration Permit.io est correcte
  async verifyConfig() {
    console.log('🔍 Vérification de la configuration Permit.io...');

    const issues = [];

    // Vérifier les ressources
    for (const resource of setupConfig.resources) {
      try {
        await permit.api.resources.get(resource.key);
      } catch (e) {
        issues.push(`Ressource manquante: ${resource.key}`);
      }
    }

    // Vérifier les rôles
    for (const role of setupConfig.roles) {
      try {
        await permit.api.roles.get(role.key);
      } catch (e) {
        issues.push(`Rôle manquant: ${role.key}`);
      }
    }

    if (issues.length === 0) {
      console.log('✅ Configuration Permit.io valide !');
      return { valid: true, issues: [] };
    } else {
      console.log('⚠️ Problèmes détectés:', issues);
      return { valid: false, issues };
    }
  }
}

module.exports = new PermitSetupService();
