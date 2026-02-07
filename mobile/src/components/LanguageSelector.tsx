import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { Language, languageNames } from '../utils/translations';

const LANGUAGES: Language[] = ['tr', 'en', 'de', 'fr', 'ar'];

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} style={styles.trigger}>
        <Text style={styles.triggerText}>{languageNames[language]}</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.menu}>
            <Text style={styles.menuTitle}>{t('close')}</Text>
            <ScrollView>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.option,
                    language === lang && styles.optionActive,
                  ]}
                  onPress={() => {
                    setLanguage(lang);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      language === lang && styles.optionTextActive,
                    ]}
                  >
                    {languageNames[lang]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  triggerText: {
    color: '#fff',
    fontSize: 14,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 16,
    minWidth: 200,
    maxHeight: 320,
  },
  menuTitle: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 8,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  optionActive: {
    backgroundColor: 'rgba(34, 211, 238, 0.2)',
  },
  optionText: {
    color: '#e5e7eb',
    fontSize: 16,
  },
  optionTextActive: {
    color: '#22d3ee',
  },
});
