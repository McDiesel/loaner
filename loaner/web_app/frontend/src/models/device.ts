// Copyright 2018 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Shelf, ShelfApiParams} from './shelf';

/**
 * Interface with fields that come from our device API.
 */
export declare interface DeviceApiParams {
  serial_number?: string;
  asset_tag?: string;
  damaged?: boolean;
  device_model?: string;
  last_update?: number;
  shelf?: ShelfApiParams;
  assigned_user?: string;
  assigned_on_date?: number;
  due_date?: number;
  current_ou?: string;
  last_heartbeat?: string;
  last_known_healthy?: string;
  lost?: boolean;
  locked?: boolean;
  pending_return?: boolean;
  mark_pending_return_date?: string;
  max_extend_date?: number;
  guest_enabled?: boolean;
  guest_permitted?: boolean;
  return_date?: string;
}

export declare interface DeviceRequestApiParams {
  asset_tag?: string;
  chrome_device_id?: string;
  serial_number?: string;
  urlkey?: string;
  unknown_identifier?: string;
}

export declare interface ExtendDeviceRequestApiParams {
  device?: DeviceRequestApiParams;
  extend_date?: string;
}

export declare interface MarkAsDamagedRequestApiParams {
  device?: DeviceRequestApiParams;
  damaged_reason?: string;
}

/** A device model with all its properties and methods. */
export class Device {
  /** Serial number of the device. */
  serialNumber = '';
  /** Asset tag of the device. */
  assetTag = '';
  /** Computer model of the device. */
  deviceModel = '';
  /** When it was last updated on our application. */
  lastUpdate: Date;
  /** Which shelf the device is currently assigned to. */
  shelf: Shelf;
  /** Which user the device is currently assigned to. */
  assignedUser = '';
  /** Which date the device was assigned to the user. */
  assignedOnDate: Date;
  /** If the device is marked as damaged. */
  damaged = false;
  /** Which date the device should be returned to the shelf. */
  dueDate: Date;
  /** Which OU the device is currently in. Eg: Root, Guest. */
  currentOu: string;
  /** The last heartbeat from the device to the backend. */
  lastHeartbeat: Date;
  /** The last check in of the device at a shelf. */
  lastKnownHealthy: Date;
  /** If the device is in a lost state for the program. */
  lost = false;
  /** If the device is in a locked state for the program. */
  locked = false;
  /** If the device is pending return for a shelf. */
  pendingReturn = false;
  /** If guest has already been enabled for this device. */
  guestEnabled = false;
  /** If guest has been enabled allowed for this device. */
  guestAllowed = false;
  /** The maximum date this device can be extended. */
  maxExtendDate: Date;
  /** The default return date. */
  returnDate: Date;
  /** List of flags relevant to this device. */
  chips: DeviceChip[] = [];

  constructor(device: DeviceApiParams = {}) {
    this.serialNumber = device.serial_number || this.serialNumber;
    this.assetTag = device.asset_tag || this.assetTag;
    this.damaged = !!device.damaged || this.damaged;
    this.deviceModel = device.device_model || this.deviceModel;
    this.lastUpdate =
        (device.last_update! && new Date(device.last_update!)) || new Date();
    this.shelf = new Shelf(device.shelf) || this.shelf;
    this.assignedUser = device.assigned_user || this.assignedUser;
    this.assignedOnDate =
        (device.assigned_on_date! && new Date(device.assigned_on_date!)) ||
        new Date();
    this.dueDate =
        (device.due_date! && new Date(device.due_date!)) || new Date();
    this.currentOu = device.current_ou || this.currentOu;
    this.lastHeartbeat =
        (device.last_heartbeat! && new Date(device.last_heartbeat!) ||
         new Date());
    this.lastKnownHealthy =
        (device.last_known_healthy! && new Date(device.last_known_healthy!) ||
         new Date());
    this.lost = device.lost || this.lost;
    this.locked = device.locked || this.locked;
    this.pendingReturn = !!device.mark_pending_return_date ||
        device.pending_return || this.pendingReturn;
    this.maxExtendDate =
        (device.max_extend_date! && new Date(device.max_extend_date!)) ||
        new Date();
    this.guestEnabled = device.guest_enabled || this.guestEnabled;
    this.guestAllowed = device.guest_permitted || this.guestAllowed;
    this.returnDate =
        (device.return_date! && new Date(device.return_date!)) || new Date();

    this.chips = this.makeChips();
  }


  /**
   * Property to retrieve the asset tag or serial number, in that order.
   */
  get id(): string {
    return this.assetTag || this.serialNumber;
  }

  /**
   * Property to determine if the device can be extended.
   */
  get canExtend(): boolean {
    return !this.pendingReturn && this.dueDate < this.maxExtendDate;
  }

  /**
   * Property to determine if a device is overdue.
   */
  get isOverdue(): boolean {
    return (!!this.assignedUser) && this.timeUntilDue < 0;
  }

  /**
   * Property to calculate amount of time (in ms) until the device is due.
   * A negative value indicates that the device is overdue.
   */
  get timeUntilDue(): number {
    return this.dueDate.valueOf() - (Date.now());
  }

  /** Translates the Device model object to the API message. */
  toApiMessage(): DeviceApiParams {
    return {
      asset_tag: this.assetTag,
      assigned_on_date: this.assignedOnDate.getTime(),
      current_ou: this.currentOu,
      device_model: this.deviceModel,
      due_date: this.dueDate.getTime(),
      last_update: this.lastUpdate.getTime(),
      locked: this.locked,
      lost: this.lost,
      pending_return: this.pendingReturn,
      serial_number: this.serialNumber,
      shelf: this.shelf.toApiMessage(),
      assigned_user: this.assignedUser,
      guest_enabled: this.guestEnabled,
      guest_permitted: this.guestAllowed,
      max_extend_date: this.maxExtendDate.getTime(),
    };
  }

  /**
   * Creates chips based on the current state of the device.
   */
  private makeChips(): DeviceChip[] {
    const chipsToReturn: DeviceChip[] = [];
    if (!this.assignedUser) {
      chipsToReturn.push({
        icon: 'person_outline',
        label: 'Unassigned',
        tooltip: 'This device is unassigned.',
        color: DeviceChipColor.OK,
        status: DeviceChipStatus.UNASSIGNED,
      });
    } else if (this.isOverdue) {
      chipsToReturn.push({
        icon: 'event_busy',
        label: 'Overdue',
        tooltip: 'This device is being held past its due date.',
        color: DeviceChipColor.WARNING,
        status: DeviceChipStatus.OVERDUE,
      });
    } else if (this.assignedUser) {
      chipsToReturn.push({
        icon: 'person',
        label: 'Assigned',
        tooltip: `This device is assigned to ${this.assignedUser}`,
        color: DeviceChipColor.PRIMARY,
        status: DeviceChipStatus.ASSIGNED,
      });
    }
    if (this.locked) {
      chipsToReturn.push({
        icon: 'lock',
        label: 'Locked',
        tooltip: 'This device is locked.',
        color: DeviceChipColor.WARNING,
        status: DeviceChipStatus.LOCKED
      });
    }
    if (this.lost) {
      chipsToReturn.push({
        icon: 'gps_off',
        label: 'Lost',
        tooltip: 'This device was marked as lost.',
        color: DeviceChipColor.WARNING,
        status: DeviceChipStatus.LOST,
      });
    }
    if (this.pendingReturn) {
      chipsToReturn.push({
        icon: 'exit_to_app',
        label: 'Pending return',
        tooltip: 'This device is pending return.',
        color: DeviceChipColor.ACCENT,
        status: DeviceChipStatus.PENDING_RETURN,
      });
    }
    if (this.damaged) {
      chipsToReturn.push({
        icon: 'build',
        label: 'Damaged',
        tooltip: 'This device is marked as damaged.',
        color: DeviceChipColor.WARNING,
        status: DeviceChipStatus.DAMAGED,
      });
    }
    return chipsToReturn;
  }
}

export enum DeviceChipColor {
  PRIMARY = 'primary',
  ACCENT = 'accent',
  WARNING = 'warn',
  OK = 'ok',
}

export enum DeviceChipStatus {
  ASSIGNED = 'Assigned',
  DAMAGED = 'Damaged',
  LOCKED = 'Locked',
  LOST = 'Lost',
  PENDING_RETURN = 'Pending return',
  OVERDUE = 'Overdue',
  UNASSIGNED = 'Unassigned',
}

export interface DeviceChip {
  color: DeviceChipColor;
  icon: string;
  label: string;
  status: DeviceChipStatus;
  tooltip: string;
}

export declare interface ListDeviceResponse {
  additional_details: boolean;
  devices: DeviceApiParams[];
  page_token: string;
}
