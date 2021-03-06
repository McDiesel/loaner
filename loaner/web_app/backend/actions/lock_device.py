# Copyright 2018 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Action to lock a device."""

from loaner.web_app import constants
from loaner.web_app.backend.actions import base_action


class Error(Exception):
  """General Error class for this module."""


class LockDeviceError(Error):
  """Error raised when we cannot lock the device."""


class LockDevice(base_action.BaseAction):
  """Action class to lock a device."""

  ACTION_NAME = 'lock_device'
  FRIENDLY_NAME = 'Lock device'

  def run(self, **kwargs):
    """Lock a device."""
    device = kwargs.get('device')
    if not device:
      raise LockDeviceError(
          'Cannot lock device. Task did not receive a device; only kwargs: '
          '{}'.format(str(kwargs)))
    device.lock(constants.ADMIN_USERNAME)
