# Cleanup unused/expired images in Openshift Image Registry

## Context

The project has 4 namcespaces ${{ secrets.OPENSHIFT_NAMESPACE_PLATE }}-tools, ${{ secrets.OPENSHIFT_NAMESPACE_PLATE }}-dev, ${{ secrets.OPENSHIFT_NAMESPACE_PLATE }}-test, ${{ secrets.OPENSHIFT_NAMESPACE_PLATE }}-prod, in the Silver cluster of the Private Cloud OpenShift platform. All of them are using quite some spaces in the image registry. The image registry is a shared resource, and when it becomes full, product teams on the Silver cluster may be unable to push new images, which can impact builds, deployments, and development activities.

In the ${{ secrets.OPENSHIFT_NAMESPACE_PLATE }}-tools namespace, there are a lot exipred build configs and builds which cause confusions for developer when they want to locate their build configs and builds. Cleaning up the expired build configs and builds will help improve the developer experience and make it easier for them to find the relevant resources.

## Goal

Create a workflow to:

- Identify and clean up unused or expired images in all 4 Openshift namespaces, but I'd like to keep three most recent release versions of each image. This will help free up space in the image registry, ensuring that product teams can continue to push new images without interruption. Please focus on two image streams: zeva2-next and zeva2-bullmq

- Clean up expired build configs and builds in the ${{ secrets.OPENSHIFT_NAMESPACE_PLATE }}-tools namespace. This will help improve the developer experience by reducing clutter and making it easier for developers to find the relevant build configs and builds.

## Steps to Achieve the Goal

In the workflow, please consider the following steps:

- Login to Openshift cluster using oc cli tool, you can refferece the job install-oc in dev-release.yaml workflow for how to install and use oc cli tool in GitHub workflow. reference the job tag-images-dev in dev-release.yaml workflow for how to login to Openshift cluster using oc cli tool in GitHub workflow. 

- Create a callable workflow job named cleanup-images-template, and the workflow will call this job for each of the environment-name(dev, test and prod) to perform the cleanup. The job will take the namespace as an input parameter, so that it can be reused for the three namespaces.
  - Identify the current images used by deployments zeva2-next-<environment-name> and zeva2-bullmq-<environment-name>, mark them as keep
  - Identify the most recent three release versions of each image, and mark them as keep. The image tags use semantic versioning, and the release versions are in format of <major>.<minor>.<patch>, for example, 1.0.1. Please make sure to identify the release versions correctly based on the image tags.
  - Delete the images which are not marked as keep, and make sure to delete the corresponding image stream tags as well. Please make sure to clean up the images and image stream tags correctly to avoid any potential issues with the deployments.

- Invoked the cleanup-images-template job for the three namespaces ${{ secrets.OPENSHIFT_NAMESPACE_PLATE }}-dev, ${{ secrets.OPENSHIFT_NAMESPACE_PLATE }}-test and ${{ secrets.OPENSHIFT_NAMESPACE_PLATE }}-prod to perform the cleanup of unused/expired images in the image registry.

- So far there are quite some images marked as keep, go to the ${{ secrets.OPENSHIFT_NAMESPACE_PLATE }}-tools namespace, and identify the images which are not same as the images marked as keep in the other three namespaces, and delete those images and corresponding image stream tags as well.

- Go to the ${{ secrets.OPENSHIFT_NAMESPACE_PLATE }}-tools namespace, only keep the running builds and associated build configs and delete the expired builds and build configs. The expired builds and build configs are those which are not in running status and have been created for more than 7 days. 

## Expected Outcome

- A workflow file named cleanup-imagses.yaml is created in .github/workflows directory, and the workflow can be triggered manually or run at 1am PST time every Thursday. When the workflow is executed, it will perform the cleanup of unused/expired images and expired build configs and builds as described in the steps above.
- Unused or expired images in all 4 Openshift namespaces are cleaned up, with the three most recent release versions of each image retained.
- Expired build configs and builds in the ${{ secrets.OPENSHIFT_NAMESPACE_PLATE }}-tools namespace are deleted, improving the developer experience by reducing clutter.
- The image registry has more free space, allowing product teams to push new images without interruption.

