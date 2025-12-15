import { useMemo, useState } from 'react';
import { Button, Code, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { getApiBaseUrl, getStoredApiBaseUrl, normalizeApiBaseUrl, setStoredApiBaseUrl } from '../../api/baseUrl';

export function SettingsPage() {
  const [apiBaseUrlInput, setApiBaseUrlInput] = useState(() => getStoredApiBaseUrl() ?? '');
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const effectiveApiBaseUrl = getApiBaseUrl();

  const resolvedApiBaseUrl = useMemo(() => {
    return normalizeApiBaseUrl(apiBaseUrlInput) || effectiveApiBaseUrl;
  }, [apiBaseUrlInput, effectiveApiBaseUrl]);

  const handleSave = () => {
    setStoredApiBaseUrl(apiBaseUrlInput);
    setStatus({
      ok: true,
      message: '已保存。返回任务页后重新加载数据，或点击“立即刷新”。',
    });
  };

  const handleReset = () => {
    setApiBaseUrlInput('');
    setStoredApiBaseUrl('');
    setStatus({ ok: true, message: '已清除自定义地址，恢复默认。' });
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setStatus(null);
      const response = await fetch(`${resolvedApiBaseUrl}/health`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setStatus({ ok: true, message: `连接成功：${data.status ?? 'ok'}` });
    } catch (error) {
      setStatus({ ok: false, message: `连接失败：${String(error)}` });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Stack gap="md" maw={720}>
      <Title order={2}>设置</Title>

      <Stack gap={6}>
        <Text fw={600}>服务端地址</Text>
        <Text size="sm" c="dimmed">
          Web 部署在同域名时可留空使用默认 <Code>/api</Code>；Tauri App 通常需要填写你的服务端地址（例如{' '}
          <Code>http://192.168.1.10:3000</Code>）。
        </Text>
      </Stack>

      <TextInput
        label="API Base URL（可留空）"
        placeholder="http://192.168.1.10:3000 或 http://192.168.1.10:3000/api"
        value={apiBaseUrlInput}
        onChange={(e) => setApiBaseUrlInput(e.currentTarget.value)}
      />

      <Text size="sm" c="dimmed">
        当前生效：<Code>{resolvedApiBaseUrl}</Code>
      </Text>

      <Group>
        <Button onClick={handleSave}>保存</Button>
        <Button variant="default" onClick={handleReset}>
          清除
        </Button>
        <Button variant="light" onClick={handleTest} loading={testing}>
          测试连接
        </Button>
        <Button variant="subtle" onClick={() => window.location.reload()}>
          立即刷新
        </Button>
      </Group>

      {status && (
        <Text c={status.ok ? 'teal' : 'red'} size="sm">
          {status.message}
        </Text>
      )}
    </Stack>
  );
}
