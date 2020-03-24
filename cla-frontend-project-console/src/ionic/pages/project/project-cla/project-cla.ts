// Copyright The Linux Foundation and each contributor to CommunityBridge.
// SPDX-License-Identifier: MIT

import { Component, ViewChild } from '@angular/core';
import { AlertController, Events, IonicPage, ModalController, Nav, NavController, NavParams } from 'ionic-angular';
import { CincoService } from '../../../services/cinco.service';
import { KeycloakService } from '../../../services/keycloak/keycloak.service';
import { SortService } from '../../../services/sort.service';
import { ClaService } from '../../../services/cla.service';
import { RolesService } from '../../../services/roles.service';
import { Restricted } from '../../../decorators/restricted';
import { GithubOrganisationModel } from '../../../models/github-organisation-model';

@Restricted({
  roles: ['isAuthenticated', 'isPmcUser']
})
@IonicPage({
  segment: 'project/:projectId/cla'
})
@Component({
  selector: 'project-cla',
  templateUrl: 'project-cla.html'
})
export class ProjectClaPage {
  loading: any;

  sfdcProjectId: string;
  githubOrganizations: GithubOrganisationModel[];

  claProjects: any;
  projectsByExternalId: any;

  iclaUploadInfo: any;
  cclaUploadInfo: any;
  @ViewChild(Nav) nav: Nav;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private cincoService: CincoService,
    private sortService: SortService,
    public modalCtrl: ModalController,
    private keycloak: KeycloakService,
    public alertCtrl: AlertController,
    public claService: ClaService,
    public rolesService: RolesService,
    public events: Events
  ) {
    this.sfdcProjectId = navParams.get('projectId');
    this.getDefaults();
  }

  getDefaults() {
    this.loading = {
      claProjects: true,
      orgs: true
    };
    this.claProjects = [];
  }

  ngOnInit() {
    this.getClaProjects();
  }

  setLoadingOrganizationsSpinner(value) {
    this.loading = {
      orgs: value
    };
  }

  sortClaProjects(projects) {
    if (projects == null || projects.length == 0) {
      return projects;
    }

    return projects.sort((a, b) => {
      return a.projectName.trim().localeCompare(b.projectName.trim());
    });
  }

  getClaProjects() {
    this.loading.claProjects = true;
    this.claService.getProjectsByExternalId(this.sfdcProjectId).subscribe((response) => {
      this.projectsByExternalId = response.projects;
      this.claProjects = this.sortClaProjects(response.projects);
      this.loading.claProjects = false;
      
      if(this.claProjects){
        this.claProjects.map((project) => {
          this.claService.getProjectRepositoriesByrOrg(project.projectID).subscribe((githubOrganizations) => {
            project.githubOrganizations = githubOrganizations;
          });
        });
      }


      // Get Github Organizations
      this.getGithubOrganisation();
      this.getGerrit();
      
    });
  }

  getGerrit() {
    for (let project of this.projectsByExternalId) {
      //Get Gerrit Instances
      this.claService.getGerritInstance(project.projectID).subscribe((gerrits) => {
        project.gerrits = gerrits;
      });
    }
  }

  getGithubOrganisation() {
    this.loading.orgs = true;
      this.claService.getOrganizations(this.sfdcProjectId).subscribe((organizations) => {
        this.loading.orgs = false;
        for (let organization of organizations) {
          this.claService.getGithubGetNamespace(organization.organization_name).subscribe(
            (providerInfo) => {
              organization.providerInfo = providerInfo;
            },
            (exception) => {
              organization.providerInfo = null;
            }
          );

          if (organization.organization_installation_id) {
            this.claService
              .getGithubOrganizationRepositories(organization.organization_name)
              .subscribe((repositories) => {
                organization.repositories = repositories;
              });
          }
        }
        this.githubOrganizations = organizations;
      });
  }

  backToProjects() {
    this.events.publish('nav:allProjects');
  }

  openClaContractConfigModal(claProject) {
    let modal;
    // Edit CLA Group
    if (claProject) {
      modal = this.modalCtrl.create('ClaContractConfigModal', {
        claProject: claProject
      });
    } else {
      // Create CLA Group
      modal = this.modalCtrl.create('ClaContractConfigModal', {
        projectId: this.sfdcProjectId
      });
    }
    modal.onDidDismiss((data) => {
      if(data){
        this.getGithubOrganisation();
      }
      
    });
    modal.present();
  }

  goToSelectTemplatePage(projectId) {
    this.navCtrl.push('ProjectClaTemplatePage', {
      sfdcProjectId: this.sfdcProjectId,
      projectId: projectId
    });
  }

  openClaContractUploadModal(claProjectId, documentType) {
    let modal = this.modalCtrl.create('ClaContractUploadModal', {
      claProjectId: claProjectId,
      documentType: documentType
    });
    modal.onDidDismiss((data) => {
      this.getClaProjects();
    });
    modal.present();
  }

  openClaViewSignaturesModal(projectID: string, projectName: string) {
    let modal = this.modalCtrl.create(
      'ClaContractViewSignaturesModal',
      {
        claProjectId: projectID,
        claProjectName: projectName
      },
      {
        cssClass: 'medium'
      }
    );
    // Signatures view modal doesn't change anything - let's not refresh the parent view
    // modal.onDidDismiss(data => {
    //   this.getClaProjects();
    // });
    modal.present().catch((error) => {
      console.log('Error opening signatures modal view, error: ' + error);
    });
  }

  openClaViewCompaniesModal(projectID: string, projectName: string) {
    let modal = this.modalCtrl.create(
      'ClaContractViewCompaniesSignaturesModal',
      {
        claProjectId: projectID,
        claProjectName: projectName
      },
      {
        cssClass: 'medium'
      }
    );
    modal.present().catch((error) => {
      console.log('Error opening signatures modal view, error: ' + error);
    });
  }

  openClaContractVersionModal(claProjectId, documentType, documents) {
    let modal = this.modalCtrl.create('ClaContractVersionModal', {
      claProjectId: claProjectId,
      documentType: documentType,
      documents: documents
    });
    modal.present();
  }

  openClaOrganizationProviderModal(claProjectId) {
    let modal = this.modalCtrl.create('ClaOrganizationProviderModal', {
      claProjectId: claProjectId
    });
    modal.onDidDismiss((data) => {
      if (data) {
        this.openClaOrganizationAppModal();
        // this.getGithubOrganisation();
      }
    });
    modal.present();
  }

  openClaConfigureGithubRepositoriesModal(claProjectId) {
    let modal = this.modalCtrl.create('ClaConfigureGithubRepositoriesModal', {
      claProjectId: claProjectId
    });
    modal.onDidDismiss((data) => {
      this.getGithubOrganisation();
    });
    modal.present();
  }

  openClaGerritModal(projectId) {
    let modal = this.modalCtrl.create('ClaGerritModal', {
      projectId: projectId
    });
    modal.onDidDismiss((data) => {
      if(data) {
        this.getGerrit();
      }
    });
    modal.present();
  }

  openClaOrganizationAppModal() {
    let modal = this.modalCtrl.create('ClaOrganizationAppModal', {});
    modal.onDidDismiss((data) => {
      console.log('data', data)
      this.getGithubOrganisation();
    });
    modal.present();
  }

  openClaContractCompaniesModal(claProjectId) {
    let modal = this.modalCtrl.create('ClaContractCompaniesModal', {
      claProjectId: claProjectId
    });
    modal.present();
  }

  openClaContractsContributorsPage(claProjectId) {
    this.navCtrl.push('ClaContractsContributorsPage', {
      claProjectId: claProjectId
    });
  }

  searchProjects(name: string, projects: any) {
    let found = false;

    if(projects){
      projects.forEach((project) => {
        if (project.projectName.search(name) !== -1) {
          found = true;
        }
      });
  
    }

    return found;
  }

  deleteConfirmation(type, payload) {
    let alert = this.alertCtrl.create({
      subTitle: `Delete ${type}`,
      message: `Are you sure you want to delete this ${type}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => { }
        },
        {
          text: 'Delete',
          handler: () => {
            switch (type) {
              case 'Github Organization':
                this.deleteClaGithubOrganization(payload);
                break;

              case 'Gerrit Instance':
                this.deleteGerritInstance(payload);
                break;
            }
          }
        }
      ]
    });

    alert.present();
  }

  deleteClaGithubOrganization(organization) {
    this.claService.deleteGithubOrganization(organization.organization_name).subscribe((response) => {
      this.getGithubOrganisation();
    });
  }

  deleteGerritInstance(gerrit) {
    this.claService.deleteGerritInstance(gerrit.gerrit_id).subscribe((response) => {
      this.getGerrit();
    });
  }

  /**
   * Called if popover dismissed with data. Passes data to a callback function
   * @param  {object} popoverData should contain .callback and .callbackData
   */
  popoverResponse(popoverData) {
    let callback = popoverData.callback;
    if (this[callback]) {
      this[callback](popoverData.callbackData);
    }
  }
}
