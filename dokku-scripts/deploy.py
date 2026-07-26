"""
collection-review-tool deploy script using mc-deploy (in system-dev-ops repo)

replaces shell scripts: push.sh, instance.sh, config.sh, common.sh
"""

import sys

from mc_deploy.base import CmdArgs, ParserArgs
from mc_deploy.dokku import DokkuDeploy, DokkuDBMixin
from mc_deploy.pyproject import PyProjectMixin

class RssFetcherDeploy(PyProjectMixin, DokkuDBMixin, DokkuDeploy):
    # Much better to increase WEB_CONCURRENCY setting (gunicorn workers)
    # than number of web containers (parallel containers don't cooperate,
    # or report stats properly)!
    DOKKU_SCALE = {"web": 1}

    # map of plugin name to service name suffix:
    DOKKU_SERVICES = {"postgres": ""}

    INST_BASE = "undp-collections-review"   # app base name
    PROJECT_REPO = "collection-review-tool"
    SERVER_HOST = "brown.angwin" # prod db location

    # uses SQLAlchemy 2, but doesn't require DB URL fix?

    def airtable_name(self):
        return "collection-review"

    def settings_get_new(self, args: ParserArgs) -> None:
        """
        load project settings
        """
        super().settings_get_new(args)

        if self.is_prod_staging():
            self.settings_load_private_files("management", "env.sh")

d = RssFetcherDeploy()
sys.exit(d.run())
