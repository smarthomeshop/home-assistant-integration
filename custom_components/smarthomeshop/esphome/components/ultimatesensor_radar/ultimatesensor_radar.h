/**
 * UltimateSensor Radar Component
 * Advanced LD2450 radar with polygon zones, entry lines, and people counting
 *
 * Based on ESPHome ld2450 component with SmartHomeShop extensions
 */
#pragma once

#include "esphome/core/component.h"
#include "esphome/core/defines.h"
#include "esphome/components/uart/uart.h"

#ifdef USE_BINARY_SENSOR
#include "esphome/components/binary_sensor/binary_sensor.h"
#endif
#ifdef USE_SENSOR
#include "esphome/components/sensor/sensor.h"
#endif
#ifdef USE_TEXT_SENSOR
#include "esphome/components/text_sensor/text_sensor.h"
#endif
#ifdef USE_NUMBER
#include "esphome/components/number/number.h"
#endif
#ifdef USE_TEXT
#include "esphome/components/text/text.h"
#endif
#ifdef USE_SWITCH
#include "esphome/components/switch/switch.h"
#endif
#ifdef USE_BUTTON
#include "esphome/components/button/button.h"
#endif

#include <array>
#include <vector>
#include <string>
#include <cmath>

namespace esphome {
namespace ultimatesensor_radar {

// Constants
static constexpr uint8_t MAX_TARGETS = 3;
static constexpr uint8_t MAX_ZONES = 4;
static constexpr uint8_t MAX_EXCLUSION_ZONES = 2;
static constexpr uint8_t MAX_ENTRY_ZONES = 2;
static constexpr uint8_t MAX_ENTRY_LINES = 2;
static constexpr uint8_t MAX_POLYGON_VERTICES = 20;
static constexpr uint8_t FRAME_LENGTH = 30;
static constexpr uint16_t PATH_HISTORY_SIZE = 600;  // ~30 seconds at 20Hz

// Target tracking info
struct Target {
  int16_t x{0};
  int16_t y{0};
  int16_t speed{0};
  uint16_t resolution{0};
  uint16_t distance{0};
  float angle{0};
  bool active{false};
};

// Polygon structure
struct Polygon {
  float vx[MAX_POLYGON_VERTICES];
  float vy[MAX_POLYGON_VERTICES];
  int count{0};

  void parse(const std::string& text);
  bool contains(float px, float py) const;
};

// Entry line structure
struct EntryLine {
  float x1{0}, y1{0}, x2{0}, y2{0};
  bool in_is_left{true};
  bool valid{false};

  void parse(const std::string& text);
  float side_of_line(float px, float py) const;
  int check_crossing(float px0, float py0, float px1, float py1) const;
};

// Previous target position for line crossing
struct PrevTarget {
  float x{0};
  float y{0};
  bool valid{false};
};

// Path history sample for entry/exit detection
struct PathSample {
  uint32_t timestamp{0};
  float x{0};
  float y{0};
};

// Circular buffer for path history
struct PathHistory {
  PathSample samples[PATH_HISTORY_SIZE];
  uint16_t head{0};

  void add(float x, float y, uint32_t timestamp);
  float calculate_distance_in_zone(const Polygon& zone, uint32_t window_ms, uint32_t now) const;
};

class UltimateSensorRadarComponent : public Component, public uart::UARTDevice {
 public:
  void setup() override;
  void loop() override;
  void dump_config() override;
  float get_setup_priority() const override { return setup_priority::DATA; }

  // Configuration setters
  void set_max_distance(uint16_t max_distance) { max_distance_ = max_distance; }
  void set_installation_angle(int8_t angle) { installation_angle_ = angle; }
  void set_invert_x(bool invert) { invert_x_ = invert; }
  void set_entry_exit_enabled(bool enabled) { entry_exit_enabled_ = enabled; }
  void set_assumed_present_timeout(uint16_t timeout_s) { assumed_present_timeout_s_ = timeout_s; }
  void set_exit_threshold_pct(uint8_t pct) { exit_threshold_pct_ = pct; }
  void set_occupancy_off_delay(uint16_t delay_s) { occupancy_off_delay_s_ = delay_s; }
  void set_zone_off_delay(uint8_t zone, uint16_t delay_s);

  // Zone configuration
  void add_polygon_zone(uint8_t zone_id, const std::string& polygon);
  void add_exclusion_zone(uint8_t zone_id, const std::string& polygon);
  void add_entry_zone(uint8_t zone_id, const std::string& polygon);
  void add_entry_line(uint8_t line_id, const std::string& line);

  // Runtime zone updates (from text entities)
  void set_polygon_zone(uint8_t zone_id, const std::string& polygon);
  void set_exclusion_zone(uint8_t zone_id, const std::string& polygon);
  void set_entry_zone(uint8_t zone_id, const std::string& polygon);
  void set_entry_line(uint8_t line_id, const std::string& line);

  // People counter
  void reset_people_count();
  int get_people_count() const { return people_count_; }

#ifdef USE_BINARY_SENSOR
  void set_occupancy_binary_sensor(binary_sensor::BinarySensor *s) { occupancy_binary_sensor_ = s; }
  void set_assumed_present_binary_sensor(binary_sensor::BinarySensor *s) { assumed_present_binary_sensor_ = s; }
  void set_zone_occupancy_binary_sensor(uint8_t zone, binary_sensor::BinarySensor *s);
  void set_target_active_binary_sensor(uint8_t target, binary_sensor::BinarySensor *s);
  void set_entry_line_crossed_binary_sensor(uint8_t line, binary_sensor::BinarySensor *s);
#endif

#ifdef USE_SENSOR
  void set_target_x_sensor(uint8_t target, sensor::Sensor *s);
  void set_target_y_sensor(uint8_t target, sensor::Sensor *s);
  void set_target_speed_sensor(uint8_t target, sensor::Sensor *s);
  void set_target_distance_sensor(uint8_t target, sensor::Sensor *s);
  void set_target_angle_sensor(uint8_t target, sensor::Sensor *s);
  void set_target_resolution_sensor(uint8_t target, sensor::Sensor *s);
  void set_zone_target_count_sensor(uint8_t zone, sensor::Sensor *s);
  void set_people_count_sensor(sensor::Sensor *s) { people_count_sensor_ = s; }
  void set_assumed_present_remaining_sensor(sensor::Sensor *s) { assumed_present_remaining_sensor_ = s; }
#endif

#ifdef USE_TEXT_SENSOR
  void set_last_crossing_direction_sensor(text_sensor::TextSensor *s) { last_crossing_direction_sensor_ = s; }
#endif

 protected:
  void process_frame_(const uint8_t *data);
  void parse_target_(const uint8_t *data, uint8_t target_idx);
  void apply_transformations_(Target &target);
  bool is_in_exclusion_zone_(float x, float y);
  void update_zone_occupancy_();
  void check_entry_line_crossings_(uint8_t target_idx, float new_x, float new_y);
  void check_entry_exit_detection_(uint8_t target_idx, bool was_detected);
  void update_assumed_present_();
  void publish_states_();

  // Configuration
  uint16_t max_distance_{6000};
  int8_t installation_angle_{0};
  bool invert_x_{false};
  bool entry_exit_enabled_{false};
  uint16_t assumed_present_timeout_s_{60};
  uint8_t exit_threshold_pct_{50};
  uint16_t occupancy_off_delay_s_{15};
  uint16_t zone_off_delays_s_[MAX_ZONES]{15, 15, 15, 15};

  // Polygon zones
  Polygon polygon_zones_[MAX_ZONES];
  Polygon exclusion_zones_[MAX_EXCLUSION_ZONES];
  Polygon entry_zones_[MAX_ENTRY_ZONES];
  EntryLine entry_lines_[MAX_ENTRY_LINES];

  // Target tracking
  Target targets_[MAX_TARGETS];
  PrevTarget prev_targets_[MAX_TARGETS];
  bool prev_detected_[MAX_TARGETS]{false, false, false};
  PathHistory path_history_[MAX_TARGETS];

  // Zone occupancy
  int zone_target_counts_[MAX_ZONES]{0, 0, 0, 0};
  bool zone_occupancy_[MAX_ZONES]{false, false, false, false};
  uint32_t zone_last_detected_ms_[MAX_ZONES]{0, 0, 0, 0};
  uint8_t last_zone_hold_{0};

  // Assumed present state
  uint32_t assumed_present_until_ms_{0};
  bool assumed_present_active_{false};

  // Occupancy timing
  uint32_t occupancy_last_detected_ms_{0};

  // People counting
  int people_count_{0};
  std::string last_crossing_direction_{"none"};

  // UART buffer
  uint8_t buffer_[FRAME_LENGTH];
  uint8_t buffer_pos_{0};
  uint32_t last_update_{0};

#ifdef USE_BINARY_SENSOR
  binary_sensor::BinarySensor *occupancy_binary_sensor_{nullptr};
  binary_sensor::BinarySensor *assumed_present_binary_sensor_{nullptr};
  binary_sensor::BinarySensor *zone_occupancy_binary_sensors_[MAX_ZONES]{nullptr};
  binary_sensor::BinarySensor *target_active_binary_sensors_[MAX_TARGETS]{nullptr};
  binary_sensor::BinarySensor *entry_line_crossed_binary_sensors_[MAX_ENTRY_LINES]{nullptr};
#endif

#ifdef USE_SENSOR
  sensor::Sensor *target_x_sensors_[MAX_TARGETS]{nullptr};
  sensor::Sensor *target_y_sensors_[MAX_TARGETS]{nullptr};
  sensor::Sensor *target_speed_sensors_[MAX_TARGETS]{nullptr};
  sensor::Sensor *target_distance_sensors_[MAX_TARGETS]{nullptr};
  sensor::Sensor *target_angle_sensors_[MAX_TARGETS]{nullptr};
  sensor::Sensor *target_resolution_sensors_[MAX_TARGETS]{nullptr};
  sensor::Sensor *zone_target_count_sensors_[MAX_ZONES]{nullptr};
  sensor::Sensor *people_count_sensor_{nullptr};
  sensor::Sensor *assumed_present_remaining_sensor_{nullptr};
#endif

#ifdef USE_TEXT_SENSOR
  text_sensor::TextSensor *last_crossing_direction_sensor_{nullptr};
#endif
};

// Forward declaration
class UltimateSensorRadarComponent;

#ifdef USE_NUMBER
class UltimateSensorNumber : public number::Number, public Component {
 public:
  void set_parent(UltimateSensorRadarComponent *parent) { parent_ = parent; }
  void set_type(uint8_t type) { type_ = type; }
  void setup() override;
  void control(float value) override;

 protected:
  UltimateSensorRadarComponent *parent_{nullptr};
  uint8_t type_{0};
};
#endif

#ifdef USE_TEXT
class UltimateSensorText : public text::Text, public Component {
 public:
  void set_parent(UltimateSensorRadarComponent *parent) { parent_ = parent; }
  void set_type(uint8_t type) { type_ = type; }
  void setup() override;
  void control(const std::string &value) override;

 protected:
  UltimateSensorRadarComponent *parent_{nullptr};
  uint8_t type_{0};
};
#endif

#ifdef USE_SWITCH
class UltimateSensorSwitch : public switch_::Switch, public Component {
 public:
  void set_parent(UltimateSensorRadarComponent *parent) { parent_ = parent; }
  void set_type(uint8_t type) { type_ = type; }
  void setup() override;
  void write_state(bool state) override;

 protected:
  UltimateSensorRadarComponent *parent_{nullptr};
  uint8_t type_{0};
};
#endif

#ifdef USE_BUTTON
class UltimateSensorButton : public button::Button, public Component {
 public:
  void set_parent(UltimateSensorRadarComponent *parent) { parent_ = parent; }
  void set_type(uint8_t type) { type_ = type; }
  void press_action() override;

 protected:
  UltimateSensorRadarComponent *parent_{nullptr};
  uint8_t type_{0};
};
#endif

}  // namespace ultimatesensor_radar
}  // namespace esphome

