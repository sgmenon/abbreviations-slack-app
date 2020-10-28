#/usr/bin/env bash

# Updates the CORS configuration of the GCS bucket used by this project
#
# Make sure you have installed gsutil from here:
# https://cloud.google.com/storage/docs/gsutil_install
#
# then update cors.json and run this batch file
#
gcloud auth login
gsutil cors set cors.json gs://sidmenon-playground.appspot.com
