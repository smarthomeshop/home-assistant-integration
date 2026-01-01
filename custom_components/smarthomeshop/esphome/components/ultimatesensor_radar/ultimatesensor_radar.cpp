/**
 * UltimateSensor Radar Component - Implementation
 * Advanced LD2450 radar with polygon zones, entry lines, and people counting
 */
#include "ultimatesensor_radar.h"
#include "esphome/core/log.h"
#include "esphome/core/hal.h"

namespace esphome {
namespace ultimatesensor_radar {

static const char *const TAG = "ultimatesensor_radar";

// LD2450 frame markers
static constexpr uint8_t FRAME_HEADER[] = {0xAA, 0xFF, 0x03, 0x00};
static constexpr uint8_t FRAME_FOOTER[] = {0x55, 0xCC};

static constexpr float DEGREES_TO_RADIANS = 3.14159265358979323846f / 180.0f;
static constexpr float RADIANS_TO_DEGREES = 180.0f / 3.14159265358979323846f;
static constexpr uint32_t PATH_WINDOW_MS = 30000;  // 30 second window for exit detection

// ============================================================================
// Path History Implementation
// ============================================================================
void PathHistory::add(float x, float y, uint32_t timestamp) {
  head = (head + 1) % PATH_HISTORY_SIZE;
  samples[head].x = x;
  samples[head].y = y;
  samples[head].timestamp = timestamp;
}

float PathHistory::calculate_distance_in_zone(const Polygon& zone, uint32_t window_ms, uint32_t now) const {
  if (zone.count < 3) return 0.0f;

  float total_distance = 0.0f;
  uint16_t idx = head;
  uint16_t steps = 0;

  while (steps < PATH_HISTORY_SIZE) {
    uint16_t prev_idx = (idx + PATH_HISTORY_SIZE - 1) % PATH_HISTORY_SIZE;
    const PathSample& curr = samples[idx];
    const PathSample& prev = samples[prev_idx];

    if (curr.timestamp == 0 || prev.timestamp == 0) break;
    if (now - curr.timestamp > window_ms) break;

    // Check if midpoint is in zone
    float mx = 0.5f * (curr.x + prev.x);
    float my = 0.5f * (curr.y + prev.y);

    if (zone.contains(mx, my)) {
      float dx = curr.x - prev.x;
      float dy = curr.y - prev.y;
      total_distance += std::sqrt(dx * dx + dy * dy);
    }

    idx = prev_idx;
    steps++;
  }

  return total_distance;
}

// ============================================================================
// Polygon Implementation
// ============================================================================
void Polygon::parse(const std::string& text) {
  count = 0;
  if (text.empty()) return;

  size_t pos = 0;
  while (pos < text.length() && count < MAX_POLYGON_VERTICES) {
    int x, y;
    int chars_read;
    if (sscanf(text.c_str() + pos, "%d:%d%n", &x, &y, &chars_read) == 2) {
      vx[count] = static_cast<float>(x);
      vy[count] = static_cast<float>(y);
      count++;
      pos += chars_read;
      if (pos < text.length() && text[pos] == ';') pos++;
    } else {
      break;
    }
  }
  ESP_LOGD(TAG, "Parsed polygon with %d vertices", count);
}

bool Polygon::contains(float px, float py) const {
  if (count < 3) return false;

  bool inside = false;
  for (int i = 0, j = count - 1; i < count; j = i++) {
    float xi = vx[i], yi = vy[i];
    float xj = vx[j], yj = vy[j];
    if (((yi > py) != (yj > py)) &&
        (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// ============================================================================
// Entry Line Implementation
// ============================================================================
void EntryLine::parse(const std::string& text) {
  valid = false;
  if (text.empty()) return;

  int ix1, iy1, ix2, iy2;
  char dir[16] = {0};

  if (sscanf(text.c_str(), "%d:%d;%d:%d;%15s", &ix1, &iy1, &ix2, &iy2, dir) >= 4) {
    x1 = static_cast<float>(ix1);
    y1 = static_cast<float>(iy1);
    x2 = static_cast<float>(ix2);
    y2 = static_cast<float>(iy2);
    in_is_left = (strcmp(dir, "left") == 0);
    valid = true;
    ESP_LOGD(TAG, "Parsed entry line: (%.0f,%.0f)-(%.0f,%.0f), in=%s",
             x1, y1, x2, y2, in_is_left ? "left" : "right");
  }
}

float EntryLine::side_of_line(float px, float py) const {
  return (x2 - x1) * (py - y1) - (y2 - y1) * (px - x1);
}

int EntryLine::check_crossing(float px0, float py0, float px1, float py1) const {
  if (!valid) return 0;

  float side0 = side_of_line(px0, py0);
  float side1 = side_of_line(px1, py1);

  // Only a crossing if we moved from one side to the other
  if (side0 * side1 >= 0) return 0;

  // Check if crossing is within line segment
  float dx = x2 - x1;
  float dy = y2 - y1;
  float len_sq = dx * dx + dy * dy;
  if (len_sq < 1.0f) return 0;

  float dpx = px1 - px0;
  float dpy = py1 - py0;
  float denom = dpx * (-dy) + dpy * dx;
  if (std::abs(denom) < 0.001f) return 0;

  float t = ((x1 - px0) * (-dy) + (y1 - py0) * dx) / denom;
  if (t < 0.0f || t > 1.0f) return 0;

  float cx = px0 + t * dpx;
  float cy = py0 + t * dpy;
  float u = ((cx - x1) * dx + (cy - y1) * dy) / len_sq;
  if (u < 0.0f || u > 1.0f) return 0;

  // Determine direction
  bool now_on_left = (side1 > 0);
  if (in_is_left) {
    return now_on_left ? 1 : -1;  // left = in (+1), right = out (-1)
  } else {
    return now_on_left ? -1 : 1;  // left = out (-1), right = in (+1)
  }
}

// ============================================================================
// Component Implementation
// ============================================================================
void UltimateSensorRadarComponent::setup() {
  ESP_LOGCONFIG(TAG, "Setting up UltimateSensor Radar...");
}

void UltimateSensorRadarComponent::dump_config() {
  ESP_LOGCONFIG(TAG, "UltimateSensor Radar:");
  ESP_LOGCONFIG(TAG, "  Max Distance: %u mm", max_distance_);
  ESP_LOGCONFIG(TAG, "  Installation Angle: %d°", installation_angle_);
  ESP_LOGCONFIG(TAG, "  Invert X: %s", invert_x_ ? "yes" : "no");
  ESP_LOGCONFIG(TAG, "  Entry/Exit Detection: %s", entry_exit_enabled_ ? "yes" : "no");
  if (entry_exit_enabled_) {
    ESP_LOGCONFIG(TAG, "  Assumed Present Timeout: %u s", assumed_present_timeout_s_);
    ESP_LOGCONFIG(TAG, "  Exit Threshold: %u%%", exit_threshold_pct_);
  }
  ESP_LOGCONFIG(TAG, "  Occupancy Off Delay: %u s", occupancy_off_delay_s_);

  for (int i = 0; i < MAX_ZONES; i++) {
    if (polygon_zones_[i].count > 0) {
      ESP_LOGCONFIG(TAG, "  Zone %d: %d vertices, off delay: %u s",
                   i + 1, polygon_zones_[i].count, zone_off_delays_s_[i]);
    }
  }
  for (int i = 0; i < MAX_ENTRY_LINES; i++) {
    if (entry_lines_[i].valid) {
      ESP_LOGCONFIG(TAG, "  Entry Line %d: (%.0f,%.0f)-(%.0f,%.0f)",
                   i + 1, entry_lines_[i].x1, entry_lines_[i].y1,
                   entry_lines_[i].x2, entry_lines_[i].y2);
    }
  }
}

void UltimateSensorRadarComponent::loop() {
  // Read available data
  while (this->available()) {
    uint8_t byte = this->read();

    // Check for frame header
    if (buffer_pos_ < 4) {
      if (byte == FRAME_HEADER[buffer_pos_]) {
        buffer_[buffer_pos_++] = byte;
      } else {
        buffer_pos_ = 0;
        if (byte == FRAME_HEADER[0]) {
          buffer_[buffer_pos_++] = byte;
        }
      }
      continue;
    }

    // Accumulate frame data
    buffer_[buffer_pos_++] = byte;

    // Check for complete frame
    if (buffer_pos_ >= FRAME_LENGTH) {
      // Verify footer
      if (buffer_[FRAME_LENGTH - 2] == FRAME_FOOTER[0] &&
          buffer_[FRAME_LENGTH - 1] == FRAME_FOOTER[1]) {
        process_frame_(buffer_);
      }
      buffer_pos_ = 0;
    }
  }
}

void UltimateSensorRadarComponent::process_frame_(const uint8_t *data) {
  uint32_t now = millis();

  // Reset zone counts
  for (int i = 0; i < MAX_ZONES; i++) {
    zone_target_counts_[i] = 0;
  }

  bool any_active = false;

  // Parse each target (3 targets, 8 bytes each, starting at byte 4)
  for (uint8_t i = 0; i < MAX_TARGETS; i++) {
    bool was_detected = prev_detected_[i];
    parse_target_(data + 4 + (i * 8), i);

    if (targets_[i].active) {
      any_active = true;

      // Check zone occupancy for active targets
      float x = targets_[i].x;
      float y = targets_[i].y;

      // Skip if in exclusion zone
      if (!is_in_exclusion_zone_(x, y)) {
        for (int z = 0; z < MAX_ZONES; z++) {
          if (polygon_zones_[z].contains(x, y)) {
            zone_target_counts_[z]++;
            last_zone_hold_ = z + 1;
            zone_last_detected_ms_[z] = now;
          }
        }
      }

      // Check entry line crossings
      check_entry_line_crossings_(i, x, y);

      // Add to path history
      path_history_[i].add(x, y, now);

      // Update previous position
      prev_targets_[i].x = x;
      prev_targets_[i].y = y;
      prev_targets_[i].valid = true;
      prev_detected_[i] = true;
    } else {
      // Target just disappeared - check entry/exit detection
      if (was_detected && entry_exit_enabled_) {
        check_entry_exit_detection_(i, was_detected);
      }
      prev_targets_[i].valid = false;
      prev_detected_[i] = false;
    }
  }

  // Update occupancy timestamp
  if (any_active) {
    occupancy_last_detected_ms_ = now;
    assumed_present_until_ms_ = 0;  // Clear assumed present when real detection
  }

  // Update assumed present state
  update_assumed_present_();

  // Update zone occupancy with off delays
  for (int i = 0; i < MAX_ZONES; i++) {
    if (zone_target_counts_[i] > 0) {
      zone_occupancy_[i] = true;
    } else {
      // Check off delay
      uint32_t delay_ms = zone_off_delays_s_[i] * 1000UL;
      if (now - zone_last_detected_ms_[i] >= delay_ms) {
        // Check for assumed present holding this zone
        if (assumed_present_active_ && last_zone_hold_ == (i + 1)) {
          zone_occupancy_[i] = true;
        } else {
          zone_occupancy_[i] = false;
        }
      }
    }
  }

  publish_states_();
}

void UltimateSensorRadarComponent::parse_target_(const uint8_t *data, uint8_t target_idx) {
  Target &target = targets_[target_idx];

  // Parse X coordinate (bytes 0-1)
  int16_t raw_x = static_cast<int16_t>((data[1] << 8) | data[0]);
  if (raw_x & 0x8000) {
    target.x = raw_x & 0x7FFF;
  } else {
    target.x = -raw_x;
  }

  // Parse Y coordinate (bytes 2-3)
  int16_t raw_y = static_cast<int16_t>((data[3] << 8) | data[2]);
  if (raw_y & 0x8000) {
    target.y = raw_y & 0x7FFF;
  } else {
    target.y = -raw_y;
  }

  // Parse speed (bytes 4-5)
  int16_t raw_speed = static_cast<int16_t>((data[5] << 8) | data[4]);
  if (raw_speed & 0x8000) {
    target.speed = (raw_speed & 0x7FFF);
  } else {
    target.speed = -raw_speed;
  }

  // Parse resolution (bytes 6-7)
  target.resolution = static_cast<uint16_t>((data[7] << 8) | data[6]);

  // Target is active if resolution is non-zero
  target.active = (target.resolution != 0);

  if (target.active) {
    // Apply transformations
    apply_transformations_(target);

    // Calculate distance and angle
    target.distance = static_cast<uint16_t>(std::sqrt(target.x * target.x + target.y * target.y));
    target.angle = std::atan2(target.y, target.x) * RADIANS_TO_DEGREES - 90.0f;

    // Check max distance
    if (target.distance > max_distance_) {
      target.active = false;
    }
  }
}

void UltimateSensorRadarComponent::apply_transformations_(Target &target) {
  // Invert X if configured
  if (invert_x_) {
    target.x = -target.x;
  }

  // Apply installation angle rotation
  if (installation_angle_ != 0) {
    float angle_rad = installation_angle_ * DEGREES_TO_RADIANS;
    float cos_a = std::cos(angle_rad);
    float sin_a = std::sin(angle_rad);

    float new_x = target.x * cos_a - target.y * sin_a;
    float new_y = target.x * sin_a + target.y * cos_a;

    target.x = static_cast<int16_t>(new_x);
    target.y = static_cast<int16_t>(new_y);
  }
}

bool UltimateSensorRadarComponent::is_in_exclusion_zone_(float x, float y) {
  for (int i = 0; i < MAX_EXCLUSION_ZONES; i++) {
    if (exclusion_zones_[i].contains(x, y)) {
      return true;
    }
  }
  return false;
}

void UltimateSensorRadarComponent::check_entry_line_crossings_(uint8_t target_idx, float new_x, float new_y) {
  if (!prev_targets_[target_idx].valid) return;

  float prev_x = prev_targets_[target_idx].x;
  float prev_y = prev_targets_[target_idx].y;

  for (int i = 0; i < MAX_ENTRY_LINES; i++) {
    int crossing = entry_lines_[i].check_crossing(prev_x, prev_y, new_x, new_y);
    if (crossing != 0) {
      int new_count = people_count_ + crossing;
      if (new_count < 0) new_count = 0;
      people_count_ = new_count;

      last_crossing_direction_ = (crossing > 0) ? "in" : "out";

      ESP_LOGI(TAG, "Target %d crossed line %d: %s, people=%d",
               target_idx + 1, i + 1, last_crossing_direction_.c_str(), people_count_);

#ifdef USE_BINARY_SENSOR
      if (entry_line_crossed_binary_sensors_[i] != nullptr) {
        entry_line_crossed_binary_sensors_[i]->publish_state(true);
      }
#endif
    }
  }
}

void UltimateSensorRadarComponent::check_entry_exit_detection_(uint8_t target_idx, bool was_detected) {
  // Calculate distance traveled in entry zones
  uint32_t now = millis();
  float threshold_scale = 1.0f + (exit_threshold_pct_ / 100.0f);

  for (int ez = 0; ez < MAX_ENTRY_ZONES; ez++) {
    if (entry_zones_[ez].count < 3) continue;

    float distance = path_history_[target_idx].calculate_distance_in_zone(
        entry_zones_[ez], PATH_WINDOW_MS, now);

    // Calculate zone depth (Y range)
    float y_min = entry_zones_[ez].vy[0];
    float y_max = entry_zones_[ez].vy[0];
    for (int v = 1; v < entry_zones_[ez].count; v++) {
      if (entry_zones_[ez].vy[v] < y_min) y_min = entry_zones_[ez].vy[v];
      if (entry_zones_[ez].vy[v] > y_max) y_max = entry_zones_[ez].vy[v];
    }
    float zone_depth = std::abs(y_max - y_min);

    // Valid exit if traveled enough distance through entry zone
    if (zone_depth > 0 && distance >= zone_depth * threshold_scale) {
      ESP_LOGD(TAG, "Target %d valid exit through entry zone %d (dist=%.0f, threshold=%.0f)",
               target_idx + 1, ez + 1, distance, zone_depth * threshold_scale);
      return;  // Valid exit, don't trigger assumed present
    }
  }

  // No valid exit detected - trigger assumed present
  if (assumed_present_timeout_s_ > 0) {
    assumed_present_until_ms_ = now + (assumed_present_timeout_s_ * 1000UL);
    ESP_LOGI(TAG, "Target %d disappeared without valid exit, assuming present for %u s",
             target_idx + 1, assumed_present_timeout_s_);
  }
}

void UltimateSensorRadarComponent::update_assumed_present_() {
  uint32_t now = millis();

  if (assumed_present_until_ms_ != 0 && now < assumed_present_until_ms_) {
    assumed_present_active_ = true;
  } else {
    assumed_present_active_ = false;
    assumed_present_until_ms_ = 0;
  }
}

void UltimateSensorRadarComponent::publish_states_() {
  uint32_t now = millis();
  bool any_active = false;
  for (int i = 0; i < MAX_TARGETS; i++) {
    if (targets_[i].active) any_active = true;
  }

  // Calculate effective occupancy (real targets OR assumed present)
  bool effective_occupancy = any_active || assumed_present_active_;

  // Apply occupancy off delay
  if (!any_active && !assumed_present_active_) {
    uint32_t delay_ms = occupancy_off_delay_s_ * 1000UL;
    if (now - occupancy_last_detected_ms_ < delay_ms) {
      effective_occupancy = true;
    }
  }

#ifdef USE_BINARY_SENSOR
  if (occupancy_binary_sensor_ != nullptr) {
    occupancy_binary_sensor_->publish_state(effective_occupancy);
  }

  if (assumed_present_binary_sensor_ != nullptr) {
    assumed_present_binary_sensor_->publish_state(assumed_present_active_);
  }

  for (int i = 0; i < MAX_ZONES; i++) {
    if (zone_occupancy_binary_sensors_[i] != nullptr) {
      zone_occupancy_binary_sensors_[i]->publish_state(zone_occupancy_[i]);
    }
  }

  for (int i = 0; i < MAX_TARGETS; i++) {
    if (target_active_binary_sensors_[i] != nullptr) {
      target_active_binary_sensors_[i]->publish_state(targets_[i].active);
    }
  }
#endif

#ifdef USE_SENSOR
  for (int i = 0; i < MAX_TARGETS; i++) {
    if (target_x_sensors_[i] != nullptr) {
      target_x_sensors_[i]->publish_state(targets_[i].x);
    }
    if (target_y_sensors_[i] != nullptr) {
      target_y_sensors_[i]->publish_state(targets_[i].y);
    }
    if (target_speed_sensors_[i] != nullptr) {
      target_speed_sensors_[i]->publish_state(targets_[i].speed);
    }
    if (target_distance_sensors_[i] != nullptr) {
      target_distance_sensors_[i]->publish_state(targets_[i].distance);
    }
    if (target_angle_sensors_[i] != nullptr) {
      target_angle_sensors_[i]->publish_state(targets_[i].angle);
    }
    if (target_resolution_sensors_[i] != nullptr) {
      target_resolution_sensors_[i]->publish_state(targets_[i].resolution);
    }
  }

  for (int i = 0; i < MAX_ZONES; i++) {
    if (zone_target_count_sensors_[i] != nullptr) {
      zone_target_count_sensors_[i]->publish_state(zone_target_counts_[i]);
    }
  }

  if (people_count_sensor_ != nullptr) {
    people_count_sensor_->publish_state(people_count_);
  }

  if (assumed_present_remaining_sensor_ != nullptr) {
    if (assumed_present_active_ && assumed_present_until_ms_ > now) {
      float remaining = (assumed_present_until_ms_ - now) / 1000.0f;
      assumed_present_remaining_sensor_->publish_state(remaining);
    } else {
      assumed_present_remaining_sensor_->publish_state(0);
    }
  }
#endif

#ifdef USE_TEXT_SENSOR
  if (last_crossing_direction_sensor_ != nullptr) {
    last_crossing_direction_sensor_->publish_state(last_crossing_direction_);
  }
#endif
}

// ============================================================================
// Zone Configuration Methods
// ============================================================================
void UltimateSensorRadarComponent::add_polygon_zone(uint8_t zone_id, const std::string& polygon) {
  if (zone_id >= 1 && zone_id <= MAX_ZONES) {
    polygon_zones_[zone_id - 1].parse(polygon);
  }
}

void UltimateSensorRadarComponent::add_exclusion_zone(uint8_t zone_id, const std::string& polygon) {
  if (zone_id >= 1 && zone_id <= MAX_EXCLUSION_ZONES) {
    exclusion_zones_[zone_id - 1].parse(polygon);
  }
}

void UltimateSensorRadarComponent::add_entry_zone(uint8_t zone_id, const std::string& polygon) {
  if (zone_id >= 1 && zone_id <= MAX_ENTRY_ZONES) {
    entry_zones_[zone_id - 1].parse(polygon);
  }
}

void UltimateSensorRadarComponent::add_entry_line(uint8_t line_id, const std::string& line) {
  if (line_id >= 1 && line_id <= MAX_ENTRY_LINES) {
    entry_lines_[line_id - 1].parse(line);
  }
}

void UltimateSensorRadarComponent::set_polygon_zone(uint8_t zone_id, const std::string& polygon) {
  add_polygon_zone(zone_id, polygon);
}

void UltimateSensorRadarComponent::set_exclusion_zone(uint8_t zone_id, const std::string& polygon) {
  add_exclusion_zone(zone_id, polygon);
}

void UltimateSensorRadarComponent::set_entry_zone(uint8_t zone_id, const std::string& polygon) {
  add_entry_zone(zone_id, polygon);
}

void UltimateSensorRadarComponent::set_entry_line(uint8_t line_id, const std::string& line) {
  add_entry_line(line_id, line);
}

void UltimateSensorRadarComponent::reset_people_count() {
  people_count_ = 0;
  ESP_LOGI(TAG, "People count reset to 0");
#ifdef USE_SENSOR
  if (people_count_sensor_ != nullptr) {
    people_count_sensor_->publish_state(0);
  }
#endif
}

void UltimateSensorRadarComponent::set_zone_off_delay(uint8_t zone, uint16_t delay_s) {
  if (zone < MAX_ZONES) {
    zone_off_delays_s_[zone] = delay_s;
  }
}

// ============================================================================
// Sensor Setters
// ============================================================================
#ifdef USE_BINARY_SENSOR
void UltimateSensorRadarComponent::set_zone_occupancy_binary_sensor(uint8_t zone, binary_sensor::BinarySensor *s) {
  if (zone < MAX_ZONES) {
    zone_occupancy_binary_sensors_[zone] = s;
  }
}

void UltimateSensorRadarComponent::set_target_active_binary_sensor(uint8_t target, binary_sensor::BinarySensor *s) {
  if (target < MAX_TARGETS) {
    target_active_binary_sensors_[target] = s;
  }
}

void UltimateSensorRadarComponent::set_entry_line_crossed_binary_sensor(uint8_t line, binary_sensor::BinarySensor *s) {
  if (line < MAX_ENTRY_LINES) {
    entry_line_crossed_binary_sensors_[line] = s;
  }
}
#endif

#ifdef USE_SENSOR
void UltimateSensorRadarComponent::set_target_x_sensor(uint8_t target, sensor::Sensor *s) {
  if (target < MAX_TARGETS) target_x_sensors_[target] = s;
}

void UltimateSensorRadarComponent::set_target_y_sensor(uint8_t target, sensor::Sensor *s) {
  if (target < MAX_TARGETS) target_y_sensors_[target] = s;
}

void UltimateSensorRadarComponent::set_target_speed_sensor(uint8_t target, sensor::Sensor *s) {
  if (target < MAX_TARGETS) target_speed_sensors_[target] = s;
}

void UltimateSensorRadarComponent::set_target_distance_sensor(uint8_t target, sensor::Sensor *s) {
  if (target < MAX_TARGETS) target_distance_sensors_[target] = s;
}

void UltimateSensorRadarComponent::set_target_angle_sensor(uint8_t target, sensor::Sensor *s) {
  if (target < MAX_TARGETS) target_angle_sensors_[target] = s;
}

void UltimateSensorRadarComponent::set_target_resolution_sensor(uint8_t target, sensor::Sensor *s) {
  if (target < MAX_TARGETS) target_resolution_sensors_[target] = s;
}

void UltimateSensorRadarComponent::set_zone_target_count_sensor(uint8_t zone, sensor::Sensor *s) {
  if (zone < MAX_ZONES) zone_target_count_sensors_[zone] = s;
}
#endif

// ============================================================================
// UltimateSensorNumber Implementation
// ============================================================================
#ifdef USE_NUMBER
void UltimateSensorNumber::setup() {
  // Restore value from flash if available
  float value;
  if (this->restore_value()) {
    this->publish_state(value);
    this->control(value);
  }
}

void UltimateSensorNumber::control(float value) {
  if (parent_ == nullptr) return;

  this->publish_state(value);

  // Type mapping:
  // 0 = MAX_DISTANCE
  // 1 = INSTALLATION_ANGLE
  // 2 = ASSUMED_PRESENT_TIMEOUT
  // 3 = EXIT_THRESHOLD
  // 4 = OCCUPANCY_OFF_DELAY
  // 10-13 = ZONE_OFF_DELAY_1-4
  // 20-35 = ZONE_COORD (zone 1-4, coord 0-3)
  // 40-47 = EXCLUSION_COORD (zone 1-2, coord 0-3)
  // 50-57 = ENTRY_ZONE_COORD (zone 1-2, coord 0-3)

  switch (type_) {
    case 0:
      parent_->set_max_distance((uint16_t)(value * 10));
      break;
    case 1:
      parent_->set_installation_angle((int8_t)value);
      break;
    case 2:
      parent_->set_assumed_present_timeout((uint16_t)value);
      break;
    case 3:
      parent_->set_exit_threshold_pct((uint8_t)value);
      break;
    case 4:
      parent_->set_occupancy_off_delay((uint16_t)value);
      break;
    default:
      if (type_ >= 10 && type_ <= 13) {
        parent_->set_zone_off_delay(type_ - 10, (uint16_t)value);
      }
      // Zone coordinates are stored but need to be converted to polygon strings
      // by the Home Assistant integration
      break;
  }
}
#endif

// ============================================================================
// UltimateSensorText Implementation
// ============================================================================
#ifdef USE_TEXT
void UltimateSensorText::setup() {
  // Restore value from flash if available
  std::string value;
  if (this->restore_value()) {
    this->publish_state(value);
    this->control(value);
  }
}

void UltimateSensorText::control(const std::string &value) {
  if (parent_ == nullptr) return;

  this->publish_state(value);

  // Type mapping:
  // 0-3 = POLYGON_ZONE_1-4
  // 10-11 = POLYGON_EXCLUSION_1-2
  // 20-21 = POLYGON_ENTRY_1-2
  // 30-31 = ENTRY_LINE_1-2

  if (type_ >= 0 && type_ <= 3) {
    parent_->set_polygon_zone(type_ + 1, value);
  } else if (type_ >= 10 && type_ <= 11) {
    parent_->set_exclusion_zone(type_ - 10 + 1, value);
  } else if (type_ >= 20 && type_ <= 21) {
    parent_->set_entry_zone(type_ - 20 + 1, value);
  } else if (type_ >= 30 && type_ <= 31) {
    parent_->set_entry_line(type_ - 30 + 1, value);
  }
}
#endif

// ============================================================================
// UltimateSensorSwitch Implementation
// ============================================================================
#ifdef USE_SWITCH
void UltimateSensorSwitch::setup() {
  // Restore state from flash if available
  bool value;
  if (this->restore_state_) {
    this->publish_state(value);
    this->write_state(value);
  }
}

void UltimateSensorSwitch::write_state(bool state) {
  if (parent_ == nullptr) return;

  this->publish_state(state);

  // Type mapping:
  // 0 = INVERT_X (Upside Down Mounting)
  // 1 = ENTRY_EXIT_ENABLED

  switch (type_) {
    case 0:
      parent_->set_invert_x(state);
      break;
    case 1:
      parent_->set_entry_exit_enabled(state);
      break;
  }
}
#endif

// ============================================================================
// UltimateSensorButton Implementation
// ============================================================================
#ifdef USE_BUTTON
void UltimateSensorButton::press_action() {
  if (parent_ == nullptr) return;

  // Type mapping:
  // 0 = RESET_PEOPLE_COUNT

  switch (type_) {
    case 0:
      parent_->reset_people_count();
      break;
  }
}
#endif

}  // namespace ultimatesensor_radar
}  // namespace esphome

